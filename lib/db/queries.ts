/**
 * Typed query helpers — the only place in the app that talks to Postgres.
 *
 * Each function maps between two representations:
 *   DB row  ←→  TypeScript type (from lib/types.ts)
 *
 * The main translation work is:
 *   - timestamp columns come back as Date objects; we convert to ISO strings
 *     (MediaItem.dateAdded etc. are all strings in the TypeScript type)
 *   - null DB values become undefined in TypeScript (the type uses `?:`)
 *   - text columns that represent enums are cast with `as` — TypeScript trusts
 *     us here because we control what goes in via the insert functions
 */

import { eq } from 'drizzle-orm'
import { db } from './index'
import {
  consumptionGoals,
  mediaItems,
  tvSeries,
  users,
} from './schema'
import type {
  ConsumptionGoal,
  MediaItem,
  MediaStatus,
  MediaType,
  TvSeries,
} from '@/lib/types'

// ─── Type helpers ─────────────────────────────────────────────────────────────

type MediaItemRow = typeof mediaItems.$inferSelect
type TvSeriesRow  = typeof tvSeries.$inferSelect
type GoalRow      = typeof consumptionGoals.$inferSelect

function rowToMediaItem(row: MediaItemRow): MediaItem {
  return {
    id: row.id,
    title: row.title,
    titleOriginal: row.titleOriginal ?? undefined,
    mediaType: row.mediaType as MediaType,
    status: row.status as MediaStatus,

    sourceText:   row.sourceText   ?? undefined,
    sourcePerson: row.sourcePerson ?? undefined,
    sourceUrl:    row.sourceUrl    ?? undefined,

    dateAdded:    row.dateAdded.toISOString(),
    dateConsumed: row.dateConsumed?.toISOString(),
    consumedYear: row.consumedYear ?? undefined,

    rating: row.rating ?? undefined,
    notes:  row.notes  ?? undefined,
    tags:   row.tags   ?? undefined,

    author:          row.author          ?? undefined,
    bookFormat:      row.bookFormat      as MediaItem['bookFormat'],
    audiobookSource: row.audiobookSource as MediaItem['audiobookSource'],

    provider:    row.provider    as MediaItem['provider'],
    director:    row.director    ?? undefined,
    movieVenue:  row.movieVenue  as MediaItem['movieVenue'],
    watchedWith: row.watchedWith ?? undefined,

    seriesId:     row.seriesId     ?? undefined,
    seasonNumber: row.seasonNumber ?? undefined,

    podcastHost: row.podcastHost ?? undefined,

    externalRefs:  row.externalRefs  as MediaItem['externalRefs'],
    coverImageUrl: row.coverImageUrl ?? undefined,
    releaseYear:   row.releaseYear   ?? undefined,
    genres:        row.genres        ?? undefined,
    description:   row.description   ?? undefined,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function rowToTvSeries(row: TvSeriesRow): TvSeries {
  return {
    id: row.id,
    title: row.title,
    seasonsAvailable: row.seasonsAvailable,
    coverImageUrl: row.coverImageUrl ?? undefined,
    externalRefs: row.externalRefs as TvSeries['externalRefs'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function rowToGoal(row: GoalRow): ConsumptionGoal {
  return {
    id: row.id,
    year: row.year,
    mediaType: row.mediaType as MediaType,
    target: row.target,
  }
}

// ─── Media Items ──────────────────────────────────────────────────────────────

export async function getItemsByUser(userId: string): Promise<MediaItem[]> {
  // LEFT JOIN tv_series to get the series externalRefs for tv_season items.
  // IMDB links live on the tv_series record, not on individual season items,
  // so we fall back to the series value when the item has no externalRefs.
  // We alias the full item row and pull only externalRefs from the series to
  // avoid column-name collisions (both tables share id, createdAt, updatedAt).
  const rows = await db
    .select({
      item: mediaItems,
      seriesExternalRefs:  tvSeries.externalRefs,
      seriesCoverImageUrl: tvSeries.coverImageUrl,
    })
    .from(mediaItems)
    .leftJoin(tvSeries, eq(mediaItems.seriesId, tvSeries.id))
    .where(eq(mediaItems.userId, userId))

  return rows.map(({ item, seriesExternalRefs, seriesCoverImageUrl }) =>
    rowToMediaItem({
      ...item,
      externalRefs:  item.externalRefs  ?? seriesExternalRefs  ?? null,
      coverImageUrl: item.coverImageUrl ?? seriesCoverImageUrl ?? null,
    }),
  )
}

export async function insertMediaItem(
  item: MediaItem,
  userId: string
): Promise<void> {
  await db.insert(mediaItems).values({
    id:     item.id,
    userId,
    title:         item.title,
    titleOriginal: item.titleOriginal ?? null,
    mediaType:     item.mediaType,
    status:        item.status,

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
    description:   item.description   ?? null,

    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  })
}

export async function deleteMediaItem(id: string): Promise<void> {
  await db.delete(mediaItems).where(eq(mediaItems.id, id))
}

export async function patchMediaItem(
  id: string,
  patch: Partial<MediaItem>
): Promise<void> {
  // Build the update object dynamically — only include fields present in patch.
  // We always bump updatedAt so the DB stays in sync with the client's optimistic update.
  const set: Record<string, unknown> = { updatedAt: new Date() }

  if (patch.title      !== undefined) set.title      = patch.title
  if (patch.status     !== undefined) set.status     = patch.status
  if (patch.rating     !== undefined) set.rating     = patch.rating ?? null
  if (patch.notes      !== undefined) set.notes      = patch.notes  ?? null
  if (patch.tags       !== undefined) set.tags       = patch.tags   ?? null

  if (patch.dateConsumed !== undefined)
    set.dateConsumed = patch.dateConsumed ? new Date(patch.dateConsumed) : null
  if (patch.consumedYear !== undefined)
    set.consumedYear = patch.consumedYear ?? null

  if (patch.bookFormat      !== undefined) set.bookFormat      = patch.bookFormat      ?? null
  if (patch.audiobookSource !== undefined) set.audiobookSource = patch.audiobookSource ?? null
  if (patch.provider        !== undefined) set.provider        = patch.provider        ?? null
  if (patch.director        !== undefined) set.director        = patch.director        ?? null
  if (patch.movieVenue      !== undefined) set.movieVenue      = patch.movieVenue      ?? null
  if (patch.watchedWith     !== undefined) set.watchedWith     = patch.watchedWith     ?? null
  if (patch.podcastHost     !== undefined) set.podcastHost     = patch.podcastHost     ?? null

  if (patch.sourceText   !== undefined) set.sourceText   = patch.sourceText   ?? null
  if (patch.sourcePerson !== undefined) set.sourcePerson = patch.sourcePerson ?? null
  if (patch.sourceUrl    !== undefined) set.sourceUrl    = patch.sourceUrl    ?? null

  if (patch.coverImageUrl !== undefined) set.coverImageUrl = patch.coverImageUrl ?? null
  if (patch.releaseYear   !== undefined) set.releaseYear   = patch.releaseYear   ?? null
  if (patch.genres        !== undefined) set.genres        = patch.genres        ?? null
  if (patch.description   !== undefined) set.description   = patch.description   ?? null

  await db
    .update(mediaItems)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(set as any)
    .where(eq(mediaItems.id, id))
}

// ─── TV Series ────────────────────────────────────────────────────────────────

export async function getAllTvSeries(): Promise<TvSeries[]> {
  const rows = await db.select().from(tvSeries)
  return rows.map(rowToTvSeries)
}

export async function insertTvSeries(series: TvSeries): Promise<void> {
  await db.insert(tvSeries).values({
    id:               series.id,
    title:            series.title,
    seasonsAvailable: series.seasonsAvailable,
    coverImageUrl:    series.coverImageUrl ?? null,
    externalRefs:     series.externalRefs  ?? null,
    createdAt:        new Date(series.createdAt),
    updatedAt:        new Date(series.updatedAt),
  })
}

// ─── Consumption Goals ────────────────────────────────────────────────────────

export async function getGoalsByUser(userId: string): Promise<ConsumptionGoal[]> {
  const rows = await db
    .select()
    .from(consumptionGoals)
    .where(eq(consumptionGoals.userId, userId))
  return rows.map(rowToGoal)
}

export async function upsertGoal(
  goal: ConsumptionGoal,
  userId: string
): Promise<void> {
  // ON CONFLICT (id) DO UPDATE — safe to call whether the goal already exists
  // or is brand new (e.g. a year/type combo with no previous target).
  await db
    .insert(consumptionGoals)
    .values({ ...goal, userId })
    .onConflictDoUpdate({
      target: consumptionGoals.id,
      set: { target: goal.target },
    })
}

// ─── Users (used by auth + seed) ─────────────────────────────────────────────

export async function getUserByUsername(username: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  return user ?? null
}

export async function insertUser(
  id: string,
  username: string,
  passwordHash: string
): Promise<void> {
  await db.insert(users).values({ id, username, passwordHash })
}
