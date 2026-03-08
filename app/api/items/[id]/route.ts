/**
 * /api/items/[id]
 *
 * PATCH — apply a partial update to a media item.
 *
 * The client sends only the changed fields (Partial<MediaItem>).
 * patchMediaItem() in queries.ts maps those to DB columns and bumps updatedAt.
 *
 * We don't verify that the item belongs to the session user here — that's
 * acceptable for a single-user personal app. Add a WHERE userId = ? clause
 * to patchMediaItem if you ever go multi-user.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { patchMediaItem } from '@/lib/db/queries'
import type { MediaItem } from '@/lib/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const patch = (await request.json()) as Partial<MediaItem>
  await patchMediaItem(id, patch)
  return NextResponse.json({ ok: true })
}
