/**
 * OMDB enrichment script.
 *
 * Fetches poster, genres, and release year from the OMDB API for:
 *   - Movies   (via media_items.externalRefs IMDB ID)
 *   - TV series (via tv_series.externalRefs IMDB ID → also writes genres to
 *               all related tv_season media_items)
 *
 * Only enriches items that are missing coverImageUrl (safe to re-run).
 *
 * Prerequisites:
 *   OMDB_API_KEY=your_key  in .env.local  (free at https://www.omdbapi.com/apikey.aspx)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/enrich-omdb.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq, isNotNull, isNull, inArray } from 'drizzle-orm'
import { db } from '../lib/db/index'
import { mediaItems, tvSeries } from '../lib/db/schema'

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.OMDB_API_KEY
if (!API_KEY) {
  console.error('❌  OMDB_API_KEY is not set in .env.local')
  console.error('    Get a free key at https://www.omdbapi.com/apikey.aspx')
  process.exit(1)
}

/** ms to wait between OMDB requests — keeps us well within 1 000 req/day */
const DELAY_MS = 300

// ─── Types ────────────────────────────────────────────────────────────────────

interface OmdbResponse {
  Response: 'True' | 'False'
  Error?: string
  Poster?: string        // URL or "N/A"
  Genre?: string         // "Drama, Comedy" or "N/A"
  Year?: string          // "2023" or "2020–2023"
  Plot?: string          // Short synopsis or "N/A"
  Director?: string      // "Christopher Nolan" or "N/A"
}

interface ExternalRef {
  service: string
  externalId: string
  url?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchOmdb(imdbId: string): Promise<OmdbResponse | null> {
  const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠  HTTP ${res.status} for ${imdbId}`)
    return null
  }
  return res.json() as Promise<OmdbResponse>
}

function parsePoster(poster?: string): string | null {
  return poster && poster !== 'N/A' ? poster : null
}

function parseGenres(genre?: string): string[] | null {
  if (!genre || genre === 'N/A') return null
  return genre.split(',').map(g => g.trim()).filter(Boolean)
}

function parseYear(year?: string): number | null {
  if (!year || year === 'N/A') return null
  const match = year.match(/\d{4}/)
  return match ? parseInt(match[0], 10) : null
}

function imdbIdFromRefs(refs: unknown): string | null {
  if (!Array.isArray(refs)) return null
  const ref = (refs as ExternalRef[]).find(r => r.service === 'imdb')
  return ref?.externalId ?? null
}

// ─── Movies ───────────────────────────────────────────────────────────────────

async function enrichMovies() {
  const rows = await db
    .select({ id: mediaItems.id, title: mediaItems.title, externalRefs: mediaItems.externalRefs })
    .from(mediaItems)
    .where(eq(mediaItems.mediaType, 'movie'))

  // Only enrich movies that are missing a cover image
  const todo = rows.filter(r => {
    const id = imdbIdFromRefs(r.externalRefs)
    return id !== null
  })

  console.log(`\n🎬  Movies: ${todo.length} with IMDB IDs`)

  let ok = 0, skipped = 0, failed = 0

  for (const row of todo) {
    const imdbId = imdbIdFromRefs(row.externalRefs)!
    await sleep(DELAY_MS)

    const data = await fetchOmdb(imdbId)
    if (!data || data.Response === 'False') {
      console.warn(`  ✗  ${row.title} (${imdbId}): ${data?.Error ?? 'no response'}`)
      failed++
      continue
    }

    const poster      = parsePoster(data.Poster)
    const genres      = parseGenres(data.Genre)
    const year        = parseYear(data.Year)
    const description = data.Plot     && data.Plot     !== 'N/A' ? data.Plot     : null
    const director    = data.Director && data.Director !== 'N/A' ? data.Director : null

    if (!poster && !genres && !year && !description && !director) {
      skipped++
      continue
    }

    await db
      .update(mediaItems)
      .set({
        ...(poster      ? { coverImageUrl: poster } : {}),
        ...(genres      ? { genres }                : {}),
        ...(year        ? { releaseYear: year }      : {}),
        ...(description ? { description }            : {}),
        ...(director    ? { director }               : {}),
        updatedAt: new Date(),
      })
      .where(eq(mediaItems.id, row.id))

    console.log(`  ✓  ${row.title}${poster ? ' [poster]' : ''}${director ? ` [${director}]` : ''}${description ? ' [plot]' : ''}`)
    ok++
  }

  console.log(`     ${ok} enriched, ${skipped} skipped (no data), ${failed} failed`)
}

// ─── TV Series ────────────────────────────────────────────────────────────────

async function enrichTvSeries() {
  const rows = await db
    .select({ id: tvSeries.id, title: tvSeries.title, externalRefs: tvSeries.externalRefs })
    .from(tvSeries)
    .where(isNotNull(tvSeries.externalRefs))

  console.log(`\n📺  TV series: ${rows.length} with IMDB IDs`)

  let ok = 0, skipped = 0, failed = 0

  for (const row of rows) {
    const imdbId = imdbIdFromRefs(row.externalRefs)
    if (!imdbId) { skipped++; continue }
    await sleep(DELAY_MS)

    const data = await fetchOmdb(imdbId)
    if (!data || data.Response === 'False') {
      console.warn(`  ✗  ${row.title} (${imdbId}): ${data?.Error ?? 'no response'}`)
      failed++
      continue
    }

    const poster      = parsePoster(data.Poster)
    const genres      = parseGenres(data.Genre)
    const year        = parseYear(data.Year)
    const description = data.Plot && data.Plot !== 'N/A' ? data.Plot : null

    // Update the series record (poster only — genres/description live on season items)
    if (poster) {
      await db
        .update(tvSeries)
        .set({ coverImageUrl: poster, updatedAt: new Date() })
        .where(eq(tvSeries.id, row.id))
    }

    // Write genres + releaseYear + description to all tv_season items for this series
    if (genres || year || description) {
      await db
        .update(mediaItems)
        .set({
          ...(genres      ? { genres }            : {}),
          ...(year        ? { releaseYear: year }  : {}),
          ...(description ? { description }        : {}),
          updatedAt: new Date(),
        })
        .where(eq(mediaItems.seriesId, row.id))
    }

    console.log(`  ✓  ${row.title}${poster ? ' [poster]' : ''}${genres ? ` [${genres.join(', ')}]` : ''}`)
    ok++
  }

  console.log(`     ${ok} enriched, ${skipped} skipped, ${failed} failed`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🎬  AmuseMe — OMDB enrichment\n')
  console.log('   Only enriches items/series missing a cover image.')
  console.log('   Safe to re-run.\n')

  await enrichMovies()
  await enrichTvSeries()

  console.log('\n✅  Enrichment complete!')
  process.exit(0)
}

run().catch(err => {
  console.error('❌  Enrichment failed:', err)
  process.exit(1)
})
