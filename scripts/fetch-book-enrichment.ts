/**
 * Fetches Open Library candidates for all book items and writes them to
 * data/book-enrichment-candidates.json for review in /admin/enrich.
 *
 * Safe to re-run — already-processed items (accepted/skipped/not-found) are
 * skipped unless you pass --force to re-fetch everything.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/fetch-book-enrichment.ts
 *   npx tsx --env-file=.env.local scripts/fetch-book-enrichment.ts --force
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { eq } from 'drizzle-orm'
import { db } from '../lib/db/index'
import { mediaItems } from '../lib/db/schema'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrichmentMatch {
  olKey: string
  olTitle: string
  coverImageUrl: string | null
  genres: string[]
  releaseYear: number | null
}

export interface EnrichmentCandidate {
  itemId: string
  itemTitle: string
  itemAuthor: string | null
  status: 'pending' | 'accepted' | 'skipped'
  match: EnrichmentMatch | null  // null = Open Library returned nothing useful
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CANDIDATES_FILE = path.join(process.cwd(), 'data', 'book-enrichment-candidates.json')
const DELAY_MS = 600   // ~100 req/5 min limit on Open Library search API
const FORCE    = process.argv.includes('--force')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function loadExisting(): Map<string, EnrichmentCandidate> {
  if (!fs.existsSync(CANDIDATES_FILE)) return new Map()
  const raw = fs.readFileSync(CANDIDATES_FILE, 'utf-8')
  const arr = JSON.parse(raw) as EnrichmentCandidate[]
  return new Map(arr.map(c => [c.itemId, c]))
}

function save(candidates: EnrichmentCandidate[]) {
  fs.mkdirSync(path.dirname(CANDIDATES_FILE), { recursive: true })
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2), 'utf-8')
}

async function searchOpenLibrary(title: string, author: string | null): Promise<EnrichmentMatch | null> {
  const params = new URLSearchParams({
    title,
    limit: '3',
    fields: 'key,title,author_name,cover_i,subject,first_publish_year',
  })
  if (author) params.set('author', author)

  const url = `https://openlibrary.org/search.json?${params}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AmuseMe/1.0 (personal reading tracker; contact via github)' },
  })
  if (!res.ok) return null

  const data = await res.json() as {
    docs: {
      key?: string
      title?: string
      author_name?: string[]
      cover_i?: number
      subject?: string[]
      first_publish_year?: number
    }[]
  }

  // Pick the first doc that has at least a title
  const doc = data.docs.find(d => d.title) ?? data.docs[0]
  if (!doc) return null

  const coverImageUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : null

  // Take first 5 subjects, filter out very long/noisy ones
  const genres = (doc.subject ?? [])
    .filter(s => s.length < 40)
    .slice(0, 5)

  return {
    olKey:        doc.key ?? '',
    olTitle:      doc.title ?? title,
    coverImageUrl,
    genres,
    releaseYear:  doc.first_publish_year ?? null,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('📚  AmuseMe — Open Library book enrichment fetch\n')

  const existing = loadExisting()
  console.log(`   ${existing.size} candidates already on file`)

  const rows = await db
    .select({ id: mediaItems.id, title: mediaItems.title, author: mediaItems.author })
    .from(mediaItems)
    .where(eq(mediaItems.mediaType, 'book'))

  console.log(`   ${rows.length} book items in DB\n`)

  const candidates: EnrichmentCandidate[] = []
  let fetched = 0, skipped = 0

  for (const row of rows) {
    const prev = existing.get(row.id)

    // Skip if already processed, unless --force
    if (prev && !FORCE) {
      candidates.push(prev)
      skipped++
      continue
    }

    await sleep(DELAY_MS)
    process.stdout.write(`  Fetching: ${row.title}...`)

    const match = await searchOpenLibrary(row.title, row.author)

    const candidate: EnrichmentCandidate = {
      itemId:     row.id,
      itemTitle:  row.title,
      itemAuthor: row.author ?? null,
      status:     'pending',
      match,
    }

    if (match) {
      console.log(` ✓ "${match.olTitle}"${match.coverImageUrl ? ' [cover]' : ' [no cover]'}`)
    } else {
      console.log(' ✗ no match')
    }

    candidates.push(candidate)
    fetched++

    // Save incrementally so a crash doesn't lose progress
    if (fetched % 10 === 0) save(candidates)
  }

  save(candidates)

  const withMatch    = candidates.filter(c => c.match !== null).length
  const withCover    = candidates.filter(c => c.match?.coverImageUrl).length
  const noMatch      = candidates.filter(c => c.match === null).length

  console.log(`\n📊  Results:`)
  console.log(`   ${fetched} fetched, ${skipped} skipped (already on file)`)
  console.log(`   ${withMatch} matched  (${withCover} with cover image)`)
  console.log(`   ${noMatch} no match`)
  console.log(`\n✅  Candidates written to data/book-enrichment-candidates.json`)
  console.log(`   Open http://localhost:3001/admin/enrich to review\n`)
  process.exit(0)
}

run().catch(err => {
  console.error('❌  Failed:', err)
  process.exit(1)
})
