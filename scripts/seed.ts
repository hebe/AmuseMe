/**
 * Database seed script.
 *
 * Creates your user account and imports all mock data into Neon.
 * Safe to re-run — every insert uses onConflictDoNothing() so existing
 * rows are left untouched.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 *
 * Required env vars (all in .env.local):
 *   DATABASE_URL    — Neon connection string
 *   SEED_USERNAME   — the username you want to log in with
 *   SEED_PASSWORD   — the password you want to log in with
 */

import { config } from 'dotenv'
import bcrypt from 'bcryptjs'

// Load .env.local before importing anything that reads process.env
config({ path: '.env.local' })

// These imports must come AFTER dotenv so DATABASE_URL is available
import { db } from '../lib/db/index'
import {
  users,
  tvSeries as tvSeriesTable,
  mediaItems as mediaItemsTable,
  consumptionGoals as goalsTable,
} from '../lib/db/schema'
import {
  tvSeries,
  mediaItems,
  consumptionGoals,
} from '../lib/mock-data'

const USERNAME = process.env.SEED_USERNAME
const PASSWORD = process.env.SEED_PASSWORD

if (!USERNAME || !PASSWORD) {
  console.error('❌  SEED_USERNAME and SEED_PASSWORD must be set in .env.local')
  process.exit(1)
}

// Fixed ID so we can reference it in media_items / goals
const USER_ID = 'user-main'

async function seed() {
  console.log('🌱  Seeding database…\n')

  // ── 1. User ──────────────────────────────────────────────────────────────
  console.log(`   Creating user "${USERNAME}"…`)
  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  await db
    .insert(users)
    .values({ id: USER_ID, username: USERNAME, passwordHash })
    .onConflictDoNothing()

  // ── 2. TV Series ─────────────────────────────────────────────────────────
  // Must come before media_items because of the FK on series_id
  console.log(`   Inserting ${tvSeries.length} TV series…`)
  for (const series of tvSeries) {
    await db
      .insert(tvSeriesTable)
      .values({
        id:               series.id,
        title:            series.title,
        seasonsAvailable: series.seasonsAvailable,
        coverImageUrl:    series.coverImageUrl ?? null,
        externalRefs:     series.externalRefs  ?? null,
        createdAt:        new Date(series.createdAt),
        updatedAt:        new Date(series.updatedAt),
      })
      .onConflictDoNothing()
  }

  // ── 3. Media Items ────────────────────────────────────────────────────────
  console.log(`   Inserting ${mediaItems.length} media items…`)
  for (const item of mediaItems) {
    await db
      .insert(mediaItemsTable)
      .values({
        id:        item.id,
        userId:    USER_ID,
        title:     item.title,
        mediaType: item.mediaType,
        status:    item.status,

        sourceText:   item.sourceText   ?? null,
        sourcePerson: item.sourcePerson ?? null,
        sourceUrl:    item.sourceUrl    ?? null,

        dateAdded:    new Date(item.dateAdded),
        dateConsumed: item.dateConsumed ? new Date(item.dateConsumed) : null,
        consumedYear: item.consumedYear ?? null,

        rating: item.rating ?? null,
        notes:  item.notes  ?? null,
        tags:   item.tags   ?? null,

        author:          item.author          ?? null,
        bookFormat:      item.bookFormat      ?? null,
        audiobookSource: item.audiobookSource ?? null,

        provider:    item.provider    ?? null,
        director:    item.director    ?? null,
        movieVenue:  item.movieVenue  ?? null,
        watchedWith: item.watchedWith ?? null,

        seriesId:     item.seriesId     ?? null,
        seasonNumber: item.seasonNumber ?? null,

        podcastHost: item.podcastHost ?? null,

        externalRefs:  item.externalRefs  ?? null,
        coverImageUrl: item.coverImageUrl ?? null,
        releaseYear:   item.releaseYear   ?? null,
        genres:        item.genres        ?? null,

        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })
      .onConflictDoNothing()
  }

  // ── 4. Consumption Goals ──────────────────────────────────────────────────
  console.log(`   Inserting ${consumptionGoals.length} goals…`)
  for (const goal of consumptionGoals) {
    await db
      .insert(goalsTable)
      .values({ ...goal, userId: USER_ID })
      .onConflictDoNothing()
  }

  console.log('\n✅  Done! You can now log in with:')
  console.log(`   Username: ${USERNAME}`)
  console.log('   Password: (the one in SEED_PASSWORD)\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
