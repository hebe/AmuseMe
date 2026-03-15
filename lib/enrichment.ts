/**
 * Shared enrichment helpers — reused by both the per-item enrich route and
 * the recommendations API (batch enrichment of Gemini suggestions).
 *
 * OMDB:        movies + TV series (cover poster, genres, release year, plot, director)
 * Google Books: books (description + cover thumbnail)
 */

const OMDB_KEY = process.env.OMDB_API_KEY

// ─── OMDB ─────────────────────────────────────────────────────────────────────

interface OmdbResponse {
  Response: 'True' | 'False'
  Error?:    string
  Poster?:   string
  Genre?:    string
  Year?:     string
  Plot?:     string
  Director?: string
}

export async function fetchOmdb(query: string): Promise<OmdbResponse | null> {
  if (!OMDB_KEY) return null
  try {
    const res = await fetch(`https://www.omdbapi.com/?${query}&apikey=${OMDB_KEY}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function omdbVal(v?: string): string | null {
  return v && v !== 'N/A' ? v : null
}

export function parseGenres(genre?: string): string[] | null {
  if (!genre || genre === 'N/A') return null
  return genre.split(',').map(g => g.trim()).filter(Boolean)
}

export function parseYear(year?: string): number | null {
  if (!year || year === 'N/A') return null
  const m = year.match(/\d{4}/)
  return m ? parseInt(m[0], 10) : null
}

export interface OmdbEnrichment {
  coverImageUrl?: string
  genres?:        string[]
  releaseYear?:   number
  description?:   string
  director?:      string
}

/** Enrich a movie or TV show by title. Returns null fields if not found. */
export async function enrichFromOmdb(
  title: string,
  type:  'movie' | 'series',
): Promise<OmdbEnrichment> {
  const data = await fetchOmdb(`t=${encodeURIComponent(title)}&type=${type}`)
  if (!data || data.Response !== 'True') return {}
  return {
    coverImageUrl: omdbVal(data.Poster)  ?? undefined,
    genres:        parseGenres(data.Genre) ?? undefined,
    releaseYear:   parseYear(data.Year)    ?? undefined,
    description:   omdbVal(data.Plot)     ?? undefined,
    director:      omdbVal(data.Director) ?? undefined,
  }
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
  const clean  = searchTitle.replace(/\s*[\(\[].*[\)\]]$/, '').toLowerCase().trim()
  const result = resultTitle.toLowerCase().trim()
  return result.includes(clean) || clean.includes(result.split(':')[0].trim())
}

type GBVolume = {
  volumeInfo?: {
    title?:       string
    description?: string
    imageLinks?:  { thumbnail?: string; smallThumbnail?: string }
  }
}

export interface GoogleBooksEnrichment {
  description?:   string
  coverImageUrl?: string
}

async function gbQuery(q: string, searchTitle: string): Promise<GoogleBooksEnrichment | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&fields=items(volumeInfo(title,description,imageLinks))`
  try {
    const res  = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { items?: GBVolume[] }
    for (const item of data.items ?? []) {
      const info = item.volumeInfo
      if (!info) continue
      if (JUNK_TITLE_RE.test(info.title ?? '')) continue
      if (info.title && !titleMatches(searchTitle, info.title)) continue
      const desc  = info.description && info.description.length >= 30 && !JUNK_DESC_RE.test(info.description)
        ? stripHtml(info.description)
        : undefined
      const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
      // Replace http with https for mixed-content safety
      const coverUrl = cover ? cover.replace(/^http:/, 'https:') : undefined
      if (desc || coverUrl) return { description: desc, coverImageUrl: coverUrl }
    }
    return null
  } catch {
    return null
  }
}

/** Enrich a book by title + optional author. Returns null fields if not found. */
export async function enrichFromGoogleBooks(
  title:  string,
  author?: string,
): Promise<GoogleBooksEnrichment> {
  if (author) {
    const result = await gbQuery(`${gbEncode(title)}+inauthor:${gbEncode(author)}`, title)
    if (result) return result
  }
  return (await gbQuery(gbEncode(title), title)) ?? {}
}
