/**
 * Drizzle schema — one table per type in lib/types.ts.
 *
 * Design notes:
 * - IDs are text (we generate them client-side, e.g. "mi-porni-s1") rather than
 *   DB-generated UUIDs so existing mock data IDs survive the migration unchanged.
 * - Enum columns (mediaType, status, bookFormat, …) are stored as plain text.
 *   Postgres enums would need migrations every time we add a value; text + TS
 *   type gives us the same safety without the DDL overhead.
 * - Arrays (tags, genres) use Postgres native text[].
 * - Flexible JSON fields (externalRefs) use jsonb.
 * - All timestamps use timestamptz (with timezone) so UTC is stored unambiguously.
 * - userId on media_items and consumption_goals future-proofs multi-user support
 *   without costing anything today.
 */

import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── TV Series ────────────────────────────────────────────────────────────────
// Parent record that groups tv_season MediaItems together.
// seasonsAvailable is updated manually when a new season is announced.

export const tvSeries = pgTable('tv_series', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  seasonsAvailable: integer('seasons_available').notNull(),
  coverImageUrl: text('cover_image_url'),
  externalRefs: jsonb('external_refs'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

// ─── Media Items ──────────────────────────────────────────────────────────────
// One row per book / movie / tv_season / podcast entry.
// Type-specific fields (author, director, seriesId, …) are nullable —
// the mediaType column tells you which subset is relevant.

export const mediaItems = pgTable('media_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),

  title: text('title').notNull(),
  // Original title in source language — useful for Nordic/international content
  // where the app title may be a translation (e.g. title: "Another Round", titleOriginal: "Druk")
  titleOriginal: text('title_original'),
  mediaType: text('media_type').notNull(),   // MediaType
  status: text('status').notNull(),           // MediaStatus

  sourceText: text('source_text'),
  sourcePerson: text('source_person'),
  sourceUrl: text('source_url'),

  dateAdded: timestamp('date_added', { withTimezone: true }).notNull(),
  dateConsumed: timestamp('date_consumed', { withTimezone: true }),
  consumedYear: integer('consumed_year'),

  rating: integer('rating'),
  notes: text('notes'),
  tags: text('tags').array(),

  // book
  author: text('author'),
  bookFormat: text('book_format'),            // BookFormat
  audiobookSource: text('audiobook_source'),  // AudiobookSource

  // movie + tv
  provider: text('provider'),                 // StreamingProvider

  // movie
  director: text('director'),
  movieVenue: text('movie_venue'),            // MovieVenue
  watchedWith: text('watched_with'),

  // tv_season — FK to tv_series; see seed order note in scripts/seed.ts
  seriesId: text('series_id').references(() => tvSeries.id),
  seasonNumber: integer('season_number'),

  // podcast
  podcastHost: text('podcast_host'),

  // metadata (M5: enrichment)
  externalRefs: jsonb('external_refs'),
  coverImageUrl: text('cover_image_url'),
  releaseYear: integer('release_year'),
  genres: text('genres').array(),
  description: text('description'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

// ─── Consumption Goals ────────────────────────────────────────────────────────

export const consumptionGoals = pgTable('consumption_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  year: integer('year').notNull(),
  mediaType: text('media_type').notNull(),    // MediaType
  target: integer('target').notNull(),
})
