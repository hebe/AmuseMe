/**
 * /api/series
 *
 * GET  — return all TV series (used to populate series autocomplete in AddItemForm)
 * POST — find-or-create a series by title; returns the existing or newly created series
 *
 * The POST is idempotent: if a series with the same title already exists (case-insensitive),
 * it returns the existing record without creating a duplicate.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllTvSeries, insertTvSeries } from '@/lib/db/queries'
import type { TvSeries } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const series = await getAllTvSeries()
  return NextResponse.json(series)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title } = (await request.json()) as { title: string }
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const trimmed = title.trim()

  // Return existing series if title matches (case-insensitive)
  const all = await getAllTvSeries()
  const existing = all.find((s) => s.title.toLowerCase() === trimmed.toLowerCase())
  if (existing) return NextResponse.json(existing)

  // Create a new series record
  const now = new Date().toISOString()
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const newSeries: TvSeries = {
    id: `series-${slug}`,
    title: trimmed,
    seasonsAvailable: 1,
    createdAt: now,
    updatedAt: now,
  }

  await insertTvSeries(newSeries)
  return NextResponse.json(newSeries, { status: 201 })
}
