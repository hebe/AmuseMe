/**
 * API routes for the /admin/enrich book enrichment validation page.
 * Reads/writes data/book-enrichment-candidates.json and patches the DB.
 *
 * GET  /api/admin/enrich          → returns all candidates
 * POST /api/admin/enrich          → accept | skip one item, or accept-all
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/index'
import { mediaItems } from '@/lib/db/schema'
import type { EnrichmentCandidate } from '@/scripts/fetch-book-enrichment'

const CANDIDATES_FILE = path.join(process.cwd(), 'data', 'book-enrichment-candidates.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readCandidates(): EnrichmentCandidate[] {
  if (!fs.existsSync(CANDIDATES_FILE)) return []
  return JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf-8')) as EnrichmentCandidate[]
}

function writeCandidates(candidates: EnrichmentCandidate[]) {
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2), 'utf-8')
}

async function applyToDb(candidate: EnrichmentCandidate) {
  if (!candidate.match) return
  const { coverImageUrl, genres, releaseYear } = candidate.match
  await db
    .update(mediaItems)
    .set({
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(genres.length  ? { genres }        : {}),
      ...(releaseYear    ? { releaseYear }    : {}),
      updatedAt: new Date(),
    })
    .where(eq(mediaItems.id, candidate.itemId))
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const candidates = readCandidates()
  return NextResponse.json(candidates)
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json() as
    | { action: 'accept';     itemId: string }
    | { action: 'skip';       itemId: string }
    | { action: 'accept-all' }

  const candidates = readCandidates()

  if (body.action === 'accept') {
    const c = candidates.find(c => c.itemId === body.itemId)
    if (!c) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await applyToDb(c)
    c.status = 'accepted'
    writeCandidates(candidates)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'skip') {
    const c = candidates.find(c => c.itemId === body.itemId)
    if (!c) return NextResponse.json({ error: 'not found' }, { status: 404 })
    c.status = 'skipped'
    writeCandidates(candidates)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'accept-all') {
    const pending = candidates.filter(c => c.status === 'pending' && c.match !== null)
    for (const c of pending) {
      await applyToDb(c)
      c.status = 'accepted'
    }
    writeCandidates(candidates)
    return NextResponse.json({ accepted: pending.length })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
