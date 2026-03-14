/**
 * POST /api/lookup
 *
 * Accepts an IMDB or Goodreads URL and returns pre-fill data for AddItemForm.
 *
 * IMDB  → extract tt-ID → OMDB API (reliable, no scraping)
 * Goodreads → extract title from URL slug → Google Books API
 *
 * Returns a partial MediaItem shape — caller merges into form state.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { ExternalRef, MediaType } from '@/lib/types'

const OMDB_KEY = process.env.OMDB_API_KEY

// ─── Result shape ─────────────────────────────────────────────────────────────

export interface LookupResult {
  title: string
  mediaType: MediaType
  author?: string
  director?: string
  releaseYear?: number
  description?: string
  genres?: string[]
  coverImageUrl?: string
  externalRefs?: ExternalRef[]
}

// ─── IMDB / OMDB ──────────────────────────────────────────────────────────────

function parseImdbId(url: string): string | null {
  const m = url.match(/imdb\.com\/title\/(tt\d+)/)
  return m ? m[1] : null
}

function omdbVal(v?: string): string | null {
  return v && v !== 'N/A' ? v : null
}
function parseGenres(g?: string): string[] | null {
  if (!g || g === 'N/A') return null
  return g.split(',').map((s) => s.trim()).filter(Boolean)
}
function parseYear(y?: string): number | null {
  if (!y || y === 'N/A') return null
  const m = y.match(/\d{4}/)
  return m ? parseInt(m[0], 10) : null
}

async function lookupImdb(imdbId: string): Promise<LookupResult | null> {
  if (!OMDB_KEY) return null
  const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`)
  if (!res.ok) return null
  const data = await res.json() as Record<string, string>
  if (data.Response === 'False') return null

  const mediaType: MediaType = data.Type === 'series' ? 'tv_season' : 'movie'

  return {
    title:        data.Title ?? '',
    mediaType,
    director:     omdbVal(data.Director)     ?? undefined,
    releaseYear:  parseYear(data.Year)       ?? undefined,
    description:  omdbVal(data.Plot)         ?? undefined,
    genres:       parseGenres(data.Genre)    ?? undefined,
    coverImageUrl: omdbVal(data.Poster)      ?? undefined,
    externalRefs: [{ service: 'imdb', externalId: imdbId, url: `https://www.imdb.com/title/${imdbId}/` }],
  }
}

// ─── Goodreads / Google Books ─────────────────────────────────────────────────

/**
 * Extract a readable title from a Goodreads URL slug.
 * e.g. "/book/show/12345.Gone_Girl"  → "Gone Girl"
 *      "/book/show/12345-gone-girl"  → "gone girl"
 *      "/book/show/12345"            → null
 */
function titleFromGoodreadsUrl(url: string): string | null {
  const m = url.match(/\/book\/show\/\d+[.\-](.+?)(?:\?|$)/)
  if (!m) return null
  return m[1].replace(/[_-]+/g, ' ').trim() || null
}

function parseGoodreadsId(url: string): string | null {
  const m = url.match(/goodreads\.com\/book\/show\/(\d+)/)
  return m ? m[1] : null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

const JUNK_TITLE_RE = /\b(summary|digest|study guide|analysis|workbook)\b/i
const JUNK_DESC_RE  = /^(summary|digest|unlock|study guide|analysis|a guide to)\b/i

async function lookupGoodreads(url: string): Promise<LookupResult | null> {
  const goodreadsId = parseGoodreadsId(url)
  const titleSlug   = titleFromGoodreadsUrl(url)

  if (!titleSlug && !goodreadsId) return null

  // Search Google Books by the slug title (or bare ID fallback)
  const searchTitle = titleSlug ?? ''
  if (!searchTitle) return null

  const q = searchTitle.trim().replace(/\s+/g, '+')
  const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&fields=items(volumeInfo(title,authors,description,imageLinks,publishedDate))`
  const res = await fetch(gbUrl)
  if (!res.ok) return null

  const data = await res.json() as {
    items?: {
      volumeInfo?: {
        title?: string
        authors?: string[]
        description?: string
        imageLinks?: { thumbnail?: string }
        publishedDate?: string
      }
    }[]
  }

  const cleanSearch = searchTitle.replace(/\s*[\(\[].*[\)\]]$/, '').toLowerCase().trim()

  for (const item of data.items ?? []) {
    const info = item.volumeInfo
    if (!info) continue
    if (JUNK_TITLE_RE.test(info.title ?? '')) continue
    if (info.description && JUNK_DESC_RE.test(info.description)) continue

    const resultTitle = (info.title ?? '').toLowerCase().trim()
    const titleOk = resultTitle.includes(cleanSearch) || cleanSearch.includes(resultTitle.split(':')[0].trim())
    if (!titleOk) continue

    const externalRefs: ExternalRef[] = []
    if (goodreadsId) {
      externalRefs.push({ service: 'goodreads', externalId: goodreadsId, url })
    }

    return {
      title:       info.title ?? searchTitle,
      mediaType:   'book',
      author:      info.authors?.[0] ?? undefined,
      description: info.description ? stripHtml(info.description) : undefined,
      coverImageUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? undefined,
      releaseYear:   info.publishedDate ? parseInt(info.publishedDate, 10) : undefined,
      ...(externalRefs.length && { externalRefs }),
    }
  }

  // No Google Books match — return minimal shell from what we know
  return {
    title:     searchTitle,
    mediaType: 'book',
    ...(goodreadsId && {
      externalRefs: [{ service: 'goodreads', externalId: goodreadsId, url }],
    }),
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = (await request.json()) as { url: string }
  if (!url?.trim()) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  let result: LookupResult | null = null

  const imdbId = parseImdbId(url)
  if (imdbId) {
    result = await lookupImdb(imdbId)
  } else if (url.includes('goodreads.com/book/show/')) {
    result = await lookupGoodreads(url)
  }

  if (!result) {
    return NextResponse.json({ error: 'Could not fetch data for this URL' }, { status: 422 })
  }

  return NextResponse.json(result)
}
