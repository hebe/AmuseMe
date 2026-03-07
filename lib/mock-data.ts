import type { MediaItem, TvSeries, ConsumptionGoal } from './types'

// ─── TV Series ────────────────────────────────────────────────────────────────

export const tvSeries: TvSeries[] = [
  {
    id: 'series-porni',
    title: 'Pørni',
    seasonsAvailable: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'ts-succession',
    title: 'Succession',
    seasonsAvailable: 4,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
]

// ─── Media Items ──────────────────────────────────────────────────────────────

export const mediaItems: MediaItem[] = [
  // TV — Pørni S1–S4 done, S5 want
  {
    id: 'mi-porni-s1',
    title: 'Pørni sesong 1',
    mediaType: 'tv_season',
    status: 'done',
    seriesId: 'series-porni',
    seasonNumber: 1,
    dateAdded: '2024-01-10T00:00:00Z',
    dateConsumed: '2024-03-15T00:00:00Z',
    consumedYear: 2024,
    rating: 5,
    sourceText: 'Anbefalt av kollegaer',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'mi-porni-s2',
    title: 'Pørni sesong 2',
    mediaType: 'tv_season',
    status: 'done',
    seriesId: 'series-porni',
    seasonNumber: 2,
    dateAdded: '2024-03-16T00:00:00Z',
    dateConsumed: '2025-01-18T00:00:00Z',
    consumedYear: 2025,
    rating: 4,
    createdAt: '2024-03-16T00:00:00Z',
    updatedAt: '2025-01-18T00:00:00Z',
  },
  {
    id: 'mi-porni-s3',
    title: 'Pørni sesong 3',
    mediaType: 'tv_season',
    status: 'done',
    seriesId: 'series-porni',
    seasonNumber: 3,
    dateAdded: '2024-09-21T00:00:00Z',
    dateConsumed: '2025-02-28T00:00:00Z',
    consumedYear: 2025,
    rating: 4,
    createdAt: '2024-09-21T00:00:00Z',
    updatedAt: '2025-02-28T00:00:00Z',
  },
  {
    id: 'mi-porni-s4',
    title: 'Pørni sesong 4',
    mediaType: 'tv_season',
    status: 'done',
    seriesId: 'series-porni',
    seasonNumber: 4,
    dateAdded: '2025-03-01T00:00:00Z',
    dateConsumed: '2026-01-10T00:00:00Z',
    consumedYear: 2026,
    rating: 5,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'mi-porni-s5',
    title: 'Pørni sesong 5',
    mediaType: 'tv_season',
    status: 'want',
    seriesId: 'series-porni',
    seasonNumber: 5,
    dateAdded: '2026-02-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'mi-succession-s1',
    title: 'Succession sesong 1',
    mediaType: 'tv_season',
    status: 'want',
    seriesId: 'ts-succession',
    seasonNumber: 1,
    dateAdded: '2026-01-20T00:00:00Z',
    sourcePerson: 'Marte',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },

  // Books — done
  {
    id: 'mi-book-intermezzo',
    title: 'Intermezzo',
    mediaType: 'book',
    status: 'done',
    author: 'Sally Rooney',
    bookFormat: 'ebook',
    dateAdded: '2024-10-01T00:00:00Z',
    dateConsumed: '2024-11-12T00:00:00Z',
    consumedYear: 2024,
    rating: 4,
    sourceText: 'Omtale i Aftenposten',
    releaseYear: 2024,
    createdAt: '2024-10-01T00:00:00Z',
    updatedAt: '2024-11-12T00:00:00Z',
  },
  {
    id: 'mi-book-hjorth',
    title: 'Arv og miljø',
    mediaType: 'book',
    status: 'done',
    author: 'Vigdis Hjorth',
    bookFormat: 'physical',
    dateAdded: '2025-11-01T00:00:00Z',
    dateConsumed: '2025-12-20T00:00:00Z',
    consumedYear: 2025,
    rating: 5,
    releaseYear: 2016,
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2025-12-20T00:00:00Z',
  },
  {
    id: 'mi-book-halperin',
    title: 'I Could Live Here Forever',
    mediaType: 'book',
    status: 'done',
    author: 'Hanna Halperin',
    bookFormat: 'audiobook',
    audiobookSource: 'storytel',
    dateAdded: '2026-01-05T00:00:00Z',
    dateConsumed: '2026-02-14T00:00:00Z',
    consumedYear: 2026,
    rating: 4,
    sourcePerson: 'Linn',
    releaseYear: 2022,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-02-14T00:00:00Z',
  },

  // Books — want
  {
    id: 'mi-book-covenant',
    title: 'The Covenant of Water',
    mediaType: 'book',
    status: 'want',
    author: 'Abraham Verghese',
    bookFormat: 'physical',
    dateAdded: '2025-08-10T00:00:00Z',
    sourcePerson: 'Mamma',
    releaseYear: 2023,
    createdAt: '2025-08-10T00:00:00Z',
    updatedAt: '2025-08-10T00:00:00Z',
  },
  {
    id: 'mi-book-james',
    title: 'James',
    mediaType: 'book',
    status: 'want',
    author: 'Percival Everett',
    dateAdded: '2026-02-20T00:00:00Z',
    sourceText: 'Booker Prize 2024',
    releaseYear: 2024,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
  },

  // Books — duplicate detection test pair
  // "The Midnight Library" (done) vs "Midnight Library" (want, missing "The")
  // → fuzzy title match (low confidence) + same author (high confidence)
  {
    id: 'mi-book-midnight-done',
    title: 'The Midnight Library',
    mediaType: 'book',
    status: 'done',
    author: 'Matt Haig',
    bookFormat: 'audiobook',
    audiobookSource: 'bookbeat',
    dateAdded: '2025-03-01T00:00:00Z',
    dateConsumed: '2025-04-05T00:00:00Z',
    consumedYear: 2025,
    rating: 3,
    releaseYear: 2020,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-04-05T00:00:00Z',
  },
  {
    id: 'mi-book-midnight-want',
    title: 'Midnight Library',
    mediaType: 'book',
    status: 'want',
    author: 'Matt Haig',
    bookFormat: 'physical',
    dateAdded: '2026-02-28T00:00:00Z',
    sourcePerson: 'Kristin',
    releaseYear: 2020,
    createdAt: '2026-02-28T00:00:00Z',
    updatedAt: '2026-02-28T00:00:00Z',
  },

  // Movies — done
  {
    id: 'mi-movie-armand',
    title: 'Armand',
    mediaType: 'movie',
    status: 'done',
    director: 'Halfdan Ullmann Tøndel',
    movieVenue: 'cinema',
    dateAdded: '2025-09-01T00:00:00Z',
    dateConsumed: '2025-09-28T00:00:00Z',
    consumedYear: 2025,
    rating: 4,
    sourceText: 'Cannes-vinner',
    releaseYear: 2024,
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-09-28T00:00:00Z',
  },
  {
    id: 'mi-movie-anora',
    title: 'Anora',
    mediaType: 'movie',
    status: 'done',
    director: 'Sean Baker',
    movieVenue: 'cinema',
    dateAdded: '2025-10-15T00:00:00Z',
    dateConsumed: '2025-11-01T00:00:00Z',
    consumedYear: 2025,
    rating: 5,
    releaseYear: 2024,
    createdAt: '2025-10-15T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'mi-movie-dune2',
    title: 'Dune: Part Two',
    mediaType: 'movie',
    status: 'done',
    director: 'Denis Villeneuve',
    movieVenue: 'cinema',
    dateAdded: '2024-02-28T00:00:00Z',
    dateConsumed: '2024-03-01T00:00:00Z',
    consumedYear: 2024,
    rating: 4,
    releaseYear: 2024,
    createdAt: '2024-02-28T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },

  // Movies — want
  {
    id: 'mi-movie-flow',
    title: 'Flow',
    mediaType: 'movie',
    status: 'want',
    director: 'Gints Zilbalodis',
    dateAdded: '2026-01-28T00:00:00Z',
    sourceText: 'Oscar-nominert animasjonsfilm',
    releaseYear: 2024,
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z',
  },
  {
    id: 'mi-movie-brutalist',
    title: 'The Brutalist',
    mediaType: 'movie',
    status: 'want',
    director: 'Brady Corbet',
    dateAdded: '2026-02-10T00:00:00Z',
    sourcePerson: 'Eirik',
    releaseYear: 2024,
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
  },

  // Podcasts — done
  {
    id: 'mi-pod-kriminalmagasinet',
    title: 'Kriminalmagasinet',
    mediaType: 'podcast',
    status: 'done',
    podcastHost: 'NRK',
    dateAdded: '2025-01-10T00:00:00Z',
    dateConsumed: '2025-06-30T00:00:00Z',
    consumedYear: 2025,
    rating: 4,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-06-30T00:00:00Z',
  },

  // Podcasts — want
  {
    id: 'mi-pod-normal-gossip',
    title: 'Normal Gossip',
    mediaType: 'podcast',
    status: 'want',
    podcastHost: 'Kelsey McKinney',
    dateAdded: '2026-03-01T00:00:00Z',
    sourcePerson: 'Ida',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
]

// ─── Consumption Goals ────────────────────────────────────────────────────────

export const consumptionGoals: ConsumptionGoal[] = [
  // 2026 targets
  { id: 'cg-2026-book', year: 2026, mediaType: 'book', target: 12 },
  { id: 'cg-2026-movie', year: 2026, mediaType: 'movie', target: 20 },
  { id: 'cg-2026-tv', year: 2026, mediaType: 'tv_season', target: 8 },
  { id: 'cg-2026-podcast', year: 2026, mediaType: 'podcast', target: 6 },

  // 2025 targets (historical)
  { id: 'cg-2025-book', year: 2025, mediaType: 'book', target: 10 },
  { id: 'cg-2025-movie', year: 2025, mediaType: 'movie', target: 20 },
  { id: 'cg-2025-tv', year: 2025, mediaType: 'tv_season', target: 6 },
  { id: 'cg-2025-podcast', year: 2025, mediaType: 'podcast', target: 2 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** How many items of a given type were consumed in a given year */
export function countConsumed(mediaType: MediaItem['mediaType'], year: number): number {
  return mediaItems.filter(
    (item) => item.mediaType === mediaType && item.status === 'done' && item.consumedYear === year
  ).length
}

/** Most recently consumed/added items, newest first */
export function recentItems(limit = 3): MediaItem[] {
  return [...mediaItems]
    .sort((a, b) => {
      const dateA = a.dateConsumed ?? a.dateAdded
      const dateB = b.dateConsumed ?? b.dateAdded
      return dateB.localeCompare(dateA)
    })
    .slice(0, limit)
}
