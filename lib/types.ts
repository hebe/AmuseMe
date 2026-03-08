export type MediaType = 'book' | 'movie' | 'tv_season' | 'podcast'
export type MediaStatus = 'want' | 'done'
export type BookFormat = 'physical' | 'ebook' | 'audiobook'
export type AudiobookSource = 'bookbeat' | 'storytel' | 'podme' | 'fabel' | 'other'
export type MovieVenue = 'cinema' | 'home' | 'other'
export type StreamingProvider =
  | 'apple'
  | 'disney'
  | 'hbo'
  | 'netflix'
  | 'nrk'
  | 'paramount'
  | 'prime'
  | 'skyshowtime'
  | 'tv2'
  | 'viaplay'
  | 'other'

export interface ConsumptionGoal {
  id: string
  year: number
  mediaType: MediaType
  target: number
}

export interface ExternalRef {
  service: string
  externalId: string
  url?: string
}

export interface TvSeries {
  id: string
  title: string
  seasonsAvailable: number    // updated manually when new seasons drop
  coverImageUrl?: string      // future: metadata enrichment
  externalRefs?: ExternalRef[]
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  title: string
  titleOriginal?: string  // original title in source language (e.g. "Druk" for "Another Round")
  mediaType: MediaType
  status: MediaStatus

  sourceText?: string
  sourcePerson?: string
  sourceUrl?: string

  dateAdded: string
  dateConsumed?: string
  consumedYear?: number

  rating?: number
  notes?: string
  tags?: string[]

  // book fields
  author?: string
  bookFormat?: BookFormat
  audiobookSource?: AudiobookSource

  // movie + tv_season fields
  provider?: StreamingProvider   // streaming service (Netflix, HBO Max, etc.)

  // movie fields
  director?: string
  movieVenue?: MovieVenue
  watchedWith?: string

  // tv_season fields — seriesId required for tv_season items
  seriesId?: string
  seasonNumber?: number

  // podcast fields
  podcastHost?: string

  externalRefs?: ExternalRef[]
  coverImageUrl?: string
  releaseYear?: number
  genres?: string[]

  createdAt: string
  updatedAt: string
}
