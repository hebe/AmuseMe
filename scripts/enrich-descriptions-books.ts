/**
 * Fetches descriptions for book items from the Google Books API.
 * No API key required for basic use (1 000 req/day free tier).
 *
 * Skips books that already have a description unless --force is passed.
 * With --force: re-fetches all and clears description if no good match found.
 * Safe to re-run.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/enrich-descriptions-books.ts
 *   npx tsx --env-file=.env.local scripts/enrich-descriptions-books.ts --force
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db } from '../lib/db/index'
import { mediaItems } from '../lib/db/schema'

const DELAY_MS = 400
const FORCE    = process.argv.includes('--force')

// Patterns that indicate a secondary "summary/analysis" book, not the real thing
const JUNK_DESCRIPTION_RE = /^(summary|digest|unlock|study guide|analysis|a guide to|workbook|chapter-by-chapter|an exploration of)\b/i
const JUNK_TITLE_RE = /\b(summary|digest|study guide|analysis|workbook|book club questions)\b/i

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

/**
 * Returns true if the result title is plausibly the book we searched for.
 * Strips series info like "(Book #1)" before comparing.
 */
function titleMatches(searchTitle: string, resultTitle: string): boolean {
  // Strip series annotation from stored title e.g. "Gone Girl (Book, #1)" → "Gone Girl"
  const cleanSearch = searchTitle.replace(/\s*[\(\[].*[\)\]]$/, '').toLowerCase().trim()
  const cleanResult = resultTitle.toLowerCase().trim()

  // Accept if either contains the other (handles subtitle variations)
  return cleanResult.includes(cleanSearch) || cleanSearch.includes(cleanResult.split(':')[0].trim())
}

type GBooksItem = { volumeInfo?: { title?: string; authors?: string[]; description?: string } }

async function queryGoogleBooks(q: string, searchTitle: string): Promise<string | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&fields=items(volumeInfo(title,authors,description))`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AmuseMe/1.0 (personal reading tracker)' },
  })
  if (!res.ok) return null

  const data = await res.json() as { items?: GBooksItem[] }
  if (!data.items?.length) return null

  for (const item of data.items) {
    const info = item.volumeInfo
    if (!info?.description || info.description.length < 30) continue

    // Skip secondary "summary/analysis" books
    if (JUNK_TITLE_RE.test(info.title ?? '')) continue
    if (JUNK_DESCRIPTION_RE.test(info.description)) continue

    // Skip if the returned title doesn't look like what we searched for
    if (info.title && !titleMatches(searchTitle, info.title)) continue

    return stripHtml(info.description)
  }
  return null
}

/** Encode a search term for Google Books q parameter: spaces → +, special chars encoded */
function gbEncode(s: string): string {
  return s.trim().replace(/\s+/g, '+').replace(/[&=#%]/g, encodeURIComponent)
}

async function fetchGoogleBooksDescription(title: string, author: string | null): Promise<string | null> {
  // Strategy 1: free-text title + author
  if (author) {
    const desc = await queryGoogleBooks(`${gbEncode(title)}+${gbEncode(author)}`, title)
    if (desc) return desc
    await new Promise(r => setTimeout(r, 200))
  }

  // Strategy 2: title only
  return queryGoogleBooks(gbEncode(title), title)
}

async function run() {
  console.log('📚  AmuseMe — Google Books description enrichment\n')

  const rows = await db
    .select({ id: mediaItems.id, title: mediaItems.title, author: mediaItems.author, description: mediaItems.description })
    .from(mediaItems)
    .where(eq(mediaItems.mediaType, 'book'))

  const todo = FORCE ? rows : rows.filter(r => !r.description)
  console.log(`   ${rows.length} books total, ${todo.length} to enrich\n`)

  let ok = 0, cleared = 0, notFound = 0, failed = 0

  for (const row of todo) {
    await sleep(DELAY_MS)
    process.stdout.write(`  ${row.title}...`)

    try {
      const description = await fetchGoogleBooksDescription(row.title, row.author)
      if (!description) {
        if (FORCE && row.description) {
          // Clear stale/bad description when re-running with --force
          await db
            .update(mediaItems)
            .set({ description: null, updatedAt: new Date() })
            .where(eq(mediaItems.id, row.id))
          console.log(' ↩ cleared (no match)')
          cleared++
        } else {
          console.log(' ✗ no description found')
          notFound++
        }
        continue
      }

      await db
        .update(mediaItems)
        .set({ description, updatedAt: new Date() })
        .where(eq(mediaItems.id, row.id))

      console.log(` ✓ (${description.slice(0, 60)}…)`)
      ok++
    } catch (err) {
      console.log(` ⚠ error: ${err}`)
      failed++
    }
  }

  console.log(`\n📊  ${ok} enriched, ${cleared} cleared, ${notFound} not found, ${failed} errors`)
  console.log('✅  Done!\n')
  process.exit(0)
}

run().catch(err => {
  console.error('❌  Failed:', err)
  process.exit(1)
})
