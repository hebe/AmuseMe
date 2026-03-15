/**
 * POST /api/recommendations
 *
 * Body: { mood?: string }
 *
 * Requires an existing taste profile (generate via POST /api/profile first).
 * Returns a RecommendationSet with want-list surfacing + new external suggestions,
 * all enriched with covers + descriptions where possible.
 *
 * maxDuration raises the Vercel function timeout above the default 10 s —
 * Gemini + parallel enrichment typically takes 20–35 s.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getItemsByUser, getUserProfile } from '@/lib/db/queries'
import { generateRecommendations } from '@/lib/ai/recommend'

// Allow up to 60 s on Vercel
export const maxDuration = 60

export async function POST(req: Request) {
  try {
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
  } catch (e) {
    console.error('[POST /api/recommendations]', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: `Recommendations failed: ${message}` },
      { status: 500 },
    )
  }
}
