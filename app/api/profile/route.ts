/**
 * /api/profile
 *
 * GET  — return the stored taste profile for the current user (null if none yet)
 * POST — generate a new taste profile from the full consumption history and store it
 *
 * Profile generation calls Gemini and takes ~10–20 s.
 * maxDuration raises the Vercel function timeout above the default 10 s.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getItemsByUser, getUserProfile, upsertUserProfile } from '@/lib/db/queries'
import { generateTasteProfile } from '@/lib/ai/profile'

// Allow up to 60 s on Vercel (Gemini generation can take 15–25 s for large histories)
export const maxDuration = 60

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(session.user.id)
    return NextResponse.json({ profile })
  } catch (e) {
    console.error('[GET /api/profile]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
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

    const items     = await getItemsByUser(session.user.id)
    const doneCount = items.filter(i => i.status === 'done').length

    if (doneCount < 5) {
      return NextResponse.json(
        { error: 'Not enough consumed items to generate a taste profile (need at least 5).' },
        { status: 400 },
      )
    }

    const { summaryText, detailJson } = await generateTasteProfile(items)
    const profile = await upsertUserProfile(session.user.id, summaryText, detailJson)

    return NextResponse.json({ profile })
  } catch (e) {
    console.error('[POST /api/profile]', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `Profile generation failed: ${message}` }, { status: 500 })
  }
}
