/**
 * /api/goals
 *
 * GET  — return all consumption goals for the logged-in user
 * POST — create or update a goal (upsert by id)
 *
 * Goal IDs are deterministic strings like "cg-2026-book", so the same
 * POST body is safe to call multiple times — it just overwrites the target.
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getGoalsByUser, upsertGoal } from '@/lib/db/queries'
import type { ConsumptionGoal } from '@/lib/types'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const goals = await getGoalsByUser(session.user.id)
  return NextResponse.json(goals)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const goal = (await request.json()) as ConsumptionGoal
  await upsertGoal(goal, session.user.id)
  return NextResponse.json(goal)
}
