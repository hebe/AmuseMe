/**
 * /api/items
 *
 * GET  — return all media items for the logged-in user
 * POST — create a new media item
 *
 * Both endpoints require an active session (checked via auth()).
 * The client sends/receives the full MediaItem shape (ISO date strings, etc.)
 * which matches what the DB query helpers return.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getItemsByUser, insertMediaItem } from '@/lib/db/queries'
import type { MediaItem } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await getItemsByUser(session.user.id)
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const item = (await request.json()) as MediaItem
  await insertMediaItem(item, session.user.id)
  return NextResponse.json(item, { status: 201 })
}
