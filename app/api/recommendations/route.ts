/**
 * POST /api/recommendations
 *
 * Body: { mood?: string }
 *
 * Requires an existing taste profile (generate via POST /api/profile first).
 * Returns a RecommendationSet with want-list surfacing + new external suggestions,
 * all enriched with covers + descriptions where possible.
 *
 * Takes ~15–30 s (Gemini + parallel enrichment requests).
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getItemsByUser, getUserProfile } from '@/lib/db/queries'
import { generateRecommendations } from '@/lib/ai/recommend'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 500 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const mood = typeof body.mood === 'string' ? body.mood.trim() || undefined : undefined

  const [profile, items] = await Promise.all([
    getUserProfile(session.user.id),
    getItemsByUser(session.user.id),
  ])

  if (!profile) {
    return NextResponse.json(
      { error: 'No taste profile found. Generate one first.' },
      { status: 400 },
    )
  }

  const wantItems = items.filter(i => i.status === 'want')
  const doneItems = items.filter(i => i.status === 'done')

  const suggestions = await generateRecommendations(
    profile.detailJson,
    wantItems,
    doneItems,
    mood,
  )

  return NextResponse.json({
    suggestions,
    mood:        mood ?? null,
    generatedAt: new Date().toISOString(),
  })
}
