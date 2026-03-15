/**
 * /api/profile
 *
 * GET  — return the stored taste profile for the current user (null if none yet)
 * POST — generate a new taste profile from the full consumption history and store it
 *
 * Profile generation calls Gemini and takes ~10–20 s; the client shows a spinner.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getItemsByUser, getUserProfile, upsertUserProfile } from '@/lib/db/queries'
import { generateTasteProfile } from '@/lib/ai/profile'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile(session.user.id)
  return NextResponse.json({ profile })
}

export async function POST() {
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

  const items = await getItemsByUser(session.user.id)
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
}
