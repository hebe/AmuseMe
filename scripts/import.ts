/**
 * Real data import script.
 *
 * Wipes all existing media data (tv_series, media_items, consumption_goals)
 * and replaces it with real historical data from 5 JSON import files.
 * The users table is left untouched.
 *
 * Import files (from ~/Downloads/media-tracker-docs/):
 *   goodreads_import_with_urls.json          — 255 books
 *   media_import_2020_non_books_v2.json      — 2020 movies + TV
 *   media_import_2021_non_books_with_imdb_everything.json
 *   media_import_2022_non_books_with_imdb.json
 *   media_import_2023_non_books_with_imdb_style_matched.json
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/import.ts
 *
 * Safe to re-run (wipe → re-insert). Does NOT touch the users table.
 */

import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local before anything that reads process.env
config({ path: '.env.local' })

import { db } from '../lib/db/index'
import {
  tvSeries as tvSeriesTable,
  mediaItems as mediaItemsTable,
  consumptionGoals as goalsTable,
} from '../lib/db/schema'

// ─── Types for import file records ────────────────────────────────────────────

interface ImportSeries {
  id: string
  title: string
  seasonsAvailable: number
  imdbUrl?: string
  createdAt: string
  updatedAt: string
}

interface ImportItem {
  id: string
  title: string
  titleOriginal?: string
  mediaType: string
  status: string
  author?: string
  bookFormat?: string
  audiobookSource?: string
  director?: string
  provider?: string
  movieVenue?: string
  watchedWith?: string
  seriesId?: string
  seasonNumber?: number
  podcastHost?: string
  releaseYear?: number
  rating?: number
  notes?: string
  tags?: string[]
  genres?: string[]
  dateAdded: string
  dateConsumed?: string
  consumedYear?: number
  createdAt: string
  updatedAt: string
  imdbUrl?: string
  goodreadsUrl?: string
}

interface ImportFile {
  tvSeries?: ImportSeries[]
  mediaItems: ImportItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the IMDB ID from a URL.
 * "https://www.imdb.com/title/tt8613070/" → "tt8613070"
 */
function imdbIdFromUrl(url: string): string | undefined {
  const m = url.match(/\/title\/(tt\d+)/)
  return m?.[1]
}

/**
 * Extract the Goodreads book ID from a URL.
 * "https://www.goodreads.com/book/show/75265531" → "75265531"
 */
function goodreadsIdFromUrl(url: string): string | undefined {
  const m = url.match(/\/show\/(\d+)/)
  return m?.[1]
}

/**
 * Build an ExternalRef array from a flat imdbUrl field on a series or item.
 */
function imdbExternalRef(imdbUrl: string) {
  const externalId = imdbIdFromUrl(imdbUrl)
  return [{ service: 'imdb', externalId: externalId ?? imdbUrl, url: imdbUrl }]
}

/**
 * Build an ExternalRef array from a flat goodreadsUrl field on a book item.
 */
function goodreadsExternalRef(goodreadsUrl: string) {
  const externalId = goodreadsIdFromUrl(goodreadsUrl)
  return [{ service: 'goodreads', externalId: externalId ?? goodreadsUrl, url: goodreadsUrl }]
}

function loadJson(filePath: string): ImportFile {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as ImportFile
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const USER_ID = 'user-main'

const IMPORT_DIR = path.join(
  process.env.HOME ?? '/Users/Hilde.Skjolberg@vg.no',
  'Downloads',
  'media-tracker-docs',
)

const FILES = [
  'goodreads_import_with_urls.json',
  'media_import_2020_non_books_v2.json',
  'media_import_2021_non_books_with_imdb_everything.json',
  'media_import_2022_non_books_with_imdb.json',
  'media_import_2023_non_books_with_imdb_style_matched.json',
]

async function run() {
  console.log('📦  AmuseMe real data import\n')

  // ── 1. Load all files ──────────────────────────────────────────────────────

  console.log('   Loading import files…')
  const datasets = FILES.map((file) => {
    const fullPath = path.join(IMPORT_DIR, file)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Import file not found: ${fullPath}`)
    }
    return loadJson(fullPath)
  })

  // ── 2. Collect + deduplicate tvSeries (series can appear in multiple year files) ──

  const seriesMap = new Map<string, ImportSeries>()
  for (const dataset of datasets) {
    for (const s of dataset.tvSeries ?? []) {
      if (!seriesMap.has(s.id)) {
        seriesMap.set(s.id, s)
      }
    }
  }
  const allSeries = [...seriesMap.values()]

  // Collect all items (no cross-file duplicates expected, but guard anyway)
  const itemsMap = new Map<string, ImportItem>()
  for (const dataset of datasets) {
    for (const item of dataset.mediaItems) {
      if (!itemsMap.has(item.id)) {
        itemsMap.set(item.id, item)
      }
    }
  }
  const allItems = [...itemsMap.values()]

  console.log(`   Found ${allSeries.length} unique TV series, ${allItems.length} unique items\n`)

  // ── 3. Wipe existing data (FK-safe order) ──────────────────────────────────

  console.log('   Wiping existing data…')
  // media_items has FK → tv_series and FK → users — must go first
  await db.delete(mediaItemsTable)
  console.log('     ✓ media_items cleared')

  // consumption_goals has FK → users only — no ordering constraint relative to tv_series
  await db.delete(goalsTable)
  console.log('     ✓ consumption_goals cleared')

  // tv_series has no FKs (it's referenced by media_items, which we already deleted)
  await db.delete(tvSeriesTable)
  console.log('     ✓ tv_series cleared')

  console.log('   Existing data wiped.\n')

  // ── 4. Insert tvSeries ────────────────────────────────────────────────────

  console.log(`   Inserting ${allSeries.length} TV series…`)
  let seriesInserted = 0
  for (const s of allSeries) {
    await db
      .insert(tvSeriesTable)
      .values({
        id:               s.id,
        title:            s.title,
        seasonsAvailable: s.seasonsAvailable,
        externalRefs:     s.imdbUrl ? imdbExternalRef(s.imdbUrl) : null,
        createdAt:        new Date(s.createdAt),
        updatedAt:        new Date(s.updatedAt),
      })
      .onConflictDoNothing()
    seriesInserted++
  }
  console.log(`     ✓ ${seriesInserted} series inserted\n`)

  // ── 5. Insert mediaItems ──────────────────────────────────────────────────

  console.log(`   Inserting ${allItems.length} media items…`)

  let itemsInserted = 0
  const warnings: string[] = []

  for (const item of allItems) {
    // Build externalRefs from flat URL fields
    let externalRefs: object[] | null = null
    if (item.imdbUrl) {
      externalRefs = imdbExternalRef(item.imdbUrl)
    } else if (item.goodreadsUrl) {
      externalRefs = goodreadsExternalRef(item.goodreadsUrl)
    }

    // Validate: tv_season items should have seriesId + seasonNumber
    if (item.mediaType === 'tv_season') {
      if (!item.seriesId) warnings.push(`WARN: ${item.id} is tv_season but has no seriesId`)
      if (!item.seasonNumber) warnings.push(`WARN: ${item.id} is tv_season but has no seasonNumber`)
    }

    // Validate: consumedYear should match dateConsumed year
    if (item.dateConsumed && item.consumedYear) {
      const dcYear = new Date(item.dateConsumed).getFullYear()
      if (dcYear !== item.consumedYear) {
        warnings.push(
          `WARN: ${item.id} consumedYear=${item.consumedYear} but dateConsumed year=${dcYear}`,
        )
      }
    }

    await db
      .insert(mediaItemsTable)
      .values({
        id:        item.id,
        userId:    USER_ID,
        title:     item.title,
        titleOriginal: item.titleOriginal ?? null,
        mediaType: item.mediaType,
        status:    item.status,

        dateAdded:    new Date(item.dateAdded),
        dateConsumed: item.dateConsumed ? new Date(item.dateConsumed) : null,
        consumedYear: item.consumedYear ?? null,

        rating: item.rating ?? null,
        notes:  item.notes  ?? null,
        tags:   item.tags   ?? null,

        author:          item.author          ?? null,
        bookFormat:      item.bookFormat      ?? null,
        audiobookSource: item.audiobookSource ?? null,

        provider:    item.provider    ?? null,
        director:    item.director    ?? null,
        movieVenue:  item.movieVenue  ?? null,
        watchedWith: item.watchedWith ?? null,

        seriesId:     item.seriesId     ?? null,
        seasonNumber: item.seasonNumber ?? null,

        podcastHost: item.podcastHost ?? null,

        externalRefs:  externalRefs,
        releaseYear:   item.releaseYear ?? null,
        genres:        item.genres      ?? null,

        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })
      .onConflictDoNothing()

    itemsInserted++
  }

  console.log(`     ✓ ${itemsInserted} items inserted\n`)

  // ── 6. Summary ────────────────────────────────────────────────────────────

  if (warnings.length > 0) {
    console.log('⚠️   Warnings:')
    for (const w of warnings) console.log(`     ${w}`)
    console.log()
  }

  // Quick type breakdown
  const typeCounts: Record<string, number> = {}
  for (const item of allItems) {
    typeCounts[item.mediaType] = (typeCounts[item.mediaType] ?? 0) + 1
  }
  console.log('   Items by type:')
  for (const [type, count] of Object.entries(typeCounts).sort()) {
    console.log(`     ${type}: ${count}`)
  }

  console.log('\n✅  Import complete! Real data is now live in Neon.')
  console.log('   Refresh the app to see your full media history.\n')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌  Import failed:', err)
  process.exit(1)
})
