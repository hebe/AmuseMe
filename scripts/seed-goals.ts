/**
 * Seed historical consumption goals.
 *
 * Safe to re-run — uses onConflictDoUpdate so existing goals are overwritten
 * with the correct targets. Does NOT touch the current year (2026) or users.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-goals.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from '../lib/db/index'
import { consumptionGoals } from '../lib/db/schema'

const USER_ID = 'user-main'

// ─── Historical goals ────────────────────────────────────────────────────────
// ID format matches GoalsContext: `cg-${year}-${mediaType}`
// Omit a row if no goal was set for that type in that year.

type GoalRow = { id: string; year: number; mediaType: string; target: number }

function goal(year: number, mediaType: string, target: number): GoalRow {
  return { id: `cg-${year}-${mediaType}`, year, mediaType, target }
}

const goals: GoalRow[] = [
  // 2025
  goal(2025, 'book',      20),
  goal(2025, 'movie',     20),
  goal(2025, 'tv_season', 25),
  // 2024
  goal(2024, 'book',      15),
  goal(2024, 'movie',     15),
  goal(2024, 'tv_season', 17),
  // 2023
  goal(2023, 'book',      15),
  goal(2023, 'movie',     10),
  goal(2023, 'tv_season', 15),
  // 2022
  goal(2022, 'book',      10),
  goal(2022, 'movie',     10),
  goal(2022, 'tv_season', 20),
  // 2021
  goal(2021, 'book',      10),
  goal(2021, 'movie',     15),
  goal(2021, 'tv_season', 25),
  // 2020 — no TV season goal
  goal(2020, 'book',      10),
  goal(2020, 'movie',      5),
  // 2019 — no TV season goal
  goal(2019, 'book',      10),
  goal(2019, 'movie',      6),
  // 2018
  goal(2018, 'book',       5),
  goal(2018, 'movie',      5),
  goal(2018, 'tv_season',  5),
]

async function run() {
  console.log(`📋  Seeding ${goals.length} historical goals…\n`)

  for (const g of goals) {
    await db
      .insert(consumptionGoals)
      .values({ ...g, userId: USER_ID })
      .onConflictDoUpdate({
        target: consumptionGoals.id,
        set: { target: g.target },
      })
    console.log(`   ✓  ${g.year} ${g.mediaType.padEnd(10)} → ${g.target}`)
  }

  console.log('\n✅  Done! Historical goals are now live.\n')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌  Failed:', err)
  process.exit(1)
})
