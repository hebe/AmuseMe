/**
 * POST /api/items/[id]/enrich
 *
 * Fetches metadata for a single item from external APIs and patches the DB.
 * - Movies:    OMDB (by IMDB ID if available, otherwise title search)
 * - Books:     Google Books (title + author)
 * - TV season: OMDB via the parent series IMDB ID
 *
 * Returns the fields that were updated so the client can optimistically apply them.
 */

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/lib/db/index'
import { mediaItems, tvSeries } from '@/lib/db/schema'
import { patchMediaItem } from '@/lib/db/queries'

const OMDB_KEY = process.env.OMDB_API_KEY

// ─── OMDB ─────────────────────────────────────────────────────────────────────

interface OmdbResponse {
  Response: 'True' | 'False'
  Error?: string
  Poster?: string
  Genre?: string
  Year?: string
  Plot?: string
  Director?: string
}

type ExternalRef = { service: string; externalId: string; url?: string }

function imdbIdFromRefs(refs: unknown): string | null {
  if (!Array.isArray(refs)) return null
  const ref = (refs as ExternalRef[]).find(r => r.service === 'imdb')
  return ref?.externalId ?? null
}

async function fetchOmdb(query: string): Promise<OmdbResponse | null> {
  if (!OMDB_KEY) return null
  const res = await fetch(`https://www.omdbapi.com/?${query}&apikey=${OMDB_KEY}`)
  if (!res.ok) return null
  return res.json()
}

function omdbVal(v?: string): string | null {
  return v && v !== 'N/A' ? v : null
}

function parseGenres(genre?: string): string[] | null {
  if (!genre || genre === 'N/A') return null
  return genre.split(',').map(g => g.trim()).filter(Boolean)
}

function parseYear(year?: string): number | null {
  if (!year || year === 'N/A') return null
  const m = year.match(/\d{4}/)
  return m ? parseInt(m[0], 10) : null
}

// ─── Google Books ─────────────────────────────────────────────────────────────

function gbEncode(s: string): string {
  return s.trim().replace(/\s+/g, '+').replace(/[&=#%]/g, encodeURIComponent)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

const JUNK_TITLE_RE = /\b(summary|digest|study guide|analysis|workbook)\b/i
const JUNK_DESC_RE  = /^(summary|digest|unlock|study guide|analysis|a guide to)\b/i

function titleMatches(searchTitle: string, resultTitle: string): boolean {
  const clean = searchTitle.replace(/\s*[\(\[].*[\)\]]$/, '').toLowerCase().trim()
  const result = resultTitle.toLowerCase().trim()
  return result.includes(clean) || clean.includes(result.split(':')[0].trim())
}

type GBItem = { volumeInfo?: { title?: string; description?: string } }

async function fetchGoogleBooksDescription(title: string, author: string | null): Promise<string | null> {
  async function query(q: string): Promise<string | null> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&fields=items(volumeInfo(title,description))`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { items?: GBItem[] }
    for (const item of data.items ?? []) {
      const info = item.volumeInfo
      if (!info?.description || info.description.length < 30) continue
      if (JUNK_TITLE_RE.test(info.title ?? '')) continue
      if (JUNK_DESC_RE.test(info.description)) continue
      if (info.title && !titleMatches(title, info.title)) continue
      return stripHtml(info.description)
    }
    return null
  }

  if (author) {
    const d = await query(`${gbEncode(title)}+${gbEncode(author)}`)
    if (d) return d
  }
  return query(gbEncode(title))
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [row] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, id))
    .limit(1)

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch: Record<string, unknown> = {}

  // ── Movie ──────────────────────────────────────────────────────────────────
  if (row.mediaType === 'movie') {
    const imdbId = imdbIdFromRefs(row.externalRefs)
    const omdbQuery = imdbId
      ? `i=${imdbId}`
      : `t=${encodeURIComponent(row.title)}&type=movie`

    const data = await fetchOmdb(omdbQuery)
    if (data?.Response === 'True') {
      const poster   = omdbVal(data.Poster)
      const genres   = parseGenres(data.Genre)
      const year     = parseYear(data.Year)
      const desc     = omdbVal(data.Plot)
      const director = omdbVal(data.Director)

      if (poster)   patch.coverImageUrl = poster
      if (genres)   patch.genres        = genres
      if (year)     patch.releaseYear   = year
      if (desc)     patch.description   = desc
      if (director) patch.director      = director
    }
  }

  // ── TV season ──────────────────────────────────────────────────────────────
  else if (row.mediaType === 'tv_season' && row.seriesId) {
    const [series] = await db
      .select({ externalRefs: tvSeries.externalRefs, coverImageUrl: tvSeries.coverImageUrl })
      .from(tvSeries)
      .where(eq(tvSeries.id, row.seriesId))
      .limit(1)

    const imdbId = imdbIdFromRefs(series?.externalRefs)
    if (imdbId) {
      const data = await fetchOmdb(`i=${imdbId}`)
      if (data?.Response === 'True') {
        const genres = parseGenres(data.Genre)
        const year   = parseYear(data.Year)
        const desc   = omdbVal(data.Plot)

        if (genres) patch.genres      = genres
        if (year)   patch.releaseYear = year
        if (desc)   patch.description = desc
        // Cover lives on tv_series — not patched here
      }
    }
  }

  // ── Book ───────────────────────────────────────────────────────────────────
  else if (row.mediaType === 'book') {
    const desc = await fetchGoogleBooksDescription(row.title, row.author ?? null)
    if (desc) patch.description = desc
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ updated: {} })
  }

  await patchMediaItem(id, patch as Parameters<typeof patchMediaItem>[1])
  return NextResponse.json({ updated: patch })
}
