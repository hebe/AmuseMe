'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { useMediaItems } from '@/hooks/useMediaItems'
import { MediaTypeIcon } from '@/components/media/MediaTypeIcon'
import { AddItemForm } from '@/components/forms/AddItemForm'
import { RatingHearts } from '@/components/media/RatingHearts'
import { cn, formatItemTitle } from '@/lib/utils'
import type {
  MediaType,
  BookFormat,
  AudiobookSource,
  StreamingProvider,
  MovieVenue,
} from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Display maps
// ─────────────────────────────────────────────────────────────────────────────

const BOOK_FORMAT_LABEL: Record<BookFormat, string> = {
  physical:  'Physical',
  ebook:     'eBook',
  audiobook: 'Audiobook',
}

const AUDIOBOOK_SOURCE_LABEL: Record<AudiobookSource, string> = {
  bookbeat: 'Bookbeat',
  storytel: 'Storytel',
  podme:    'PodMe',
  fabel:    'Fabel',
  other:    'Other',
}

const PROVIDER_LABEL: Record<StreamingProvider, string> = {
  apple:       'Apple TV+',
  disney:      'Disney+',
  hbo:         'HBO Max',
  netflix:     'Netflix',
  nrk:         'NRK TV',
  paramount:   'Paramount+',
  prime:       'Prime Video',
  skyshowtime: 'SkyShowtime',
  tv2:         'TV 2 Play',
  viaplay:     'Viaplay',
  other:       'Other',
}

const MOVIE_VENUE_LABEL: Record<MovieVenue, string> = {
  cinema: 'Cinema',
  home:   'At home',
  other:  'Other',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nb-NO', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  }).format(new Date(iso))
}

/** "Consumed 5. april 2025 · Audiobook · Bookbeat" or "Added 14. mars 2024" */
function buildConsumedLine(item: {
  status: string
  dateConsumed?: string
  dateAdded: string
  mediaType: MediaType
  bookFormat?: BookFormat
  audiobookSource?: AudiobookSource
  provider?: StreamingProvider
  movieVenue?: MovieVenue
}): string {
  if (item.status !== 'done' || !item.dateConsumed) {
    return `Added ${formatDate(item.dateAdded)}`
  }
  const parts = [`Consumed ${formatDate(item.dateConsumed)}`]
  if (item.mediaType === 'book') {
    if (item.bookFormat)      parts.push(BOOK_FORMAT_LABEL[item.bookFormat])
    if (item.audiobookSource) parts.push(AUDIOBOOK_SOURCE_LABEL[item.audiobookSource])
  } else if (item.mediaType === 'movie') {
    if (item.movieVenue && item.movieVenue !== 'home') parts.push(MOVIE_VENUE_LABEL[item.movieVenue])
    if (item.provider) parts.push(PROVIDER_LABEL[item.provider])
  } else if (item.mediaType === 'tv_season') {
    if (item.provider) parts.push(PROVIDER_LABEL[item.provider])
  }
  return parts.join(' · ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ItemDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { getItemById, updateItem, deleteItem } = useMediaItems()
  const [isEditing, setIsEditing]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<'entry' | 'summary' | null>(null)

  const item = getItemById(id)

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!item) {
    return (
      <main className="px-4 pt-8">
        <button onClick={() => router.back()} className="mb-4 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm text-muted-foreground">This item doesn't exist or has been removed.</p>
      </main>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <main className="px-4 pb-24">
        <header className="flex items-center justify-between pt-8 pb-2">
          <span className="text-base font-medium">Edit</span>
          <button
            onClick={() => { setIsEditing(false); setConfirmDelete(null) }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </header>

        <AddItemForm editItem={item} onSaveEdit={() => setIsEditing(false)} />

        {/* ── Danger zone ── */}
        <div className="mt-2 flex flex-col gap-3 border-t border-border/30 pt-6">

          {/* Delete summary */}
          {item.description && (
            confirmDelete === 'summary' ? (
              <div className="flex items-center gap-3">
                <span className="flex-1 text-xs text-muted-foreground">Remove the synopsis?</span>
                <button
                  onClick={() => { updateItem(id, { description: undefined }); setConfirmDelete(null) }}
                  className="text-xs font-medium text-red-500"
                >
                  Yes, remove
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete('summary')}
                className="text-left text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                Delete synopsis
              </button>
            )
          )}

          {/* Delete entry */}
          {confirmDelete === 'entry' ? (
            <div className="flex items-center gap-3">
              <span className="flex-1 text-xs text-muted-foreground">Delete this entry permanently?</span>
              <button
                onClick={() => { deleteItem(id); router.replace('/library') }}
                className="text-xs font-medium text-red-500"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-xs text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete('entry')}
              className="text-left text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Delete entry
            </button>
          )}
        </div>
      </main>
    )
  }

  // ── Status toggle ──────────────────────────────────────────────────────────
  function handleToggleStatus() {
    if (item!.status === 'done') {
      updateItem(id, { status: 'want', dateConsumed: undefined, consumedYear: undefined })
    } else {
      const now = new Date().toISOString()
      updateItem(id, { status: 'done', dateConsumed: now, consumedYear: new Date().getFullYear() })
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const title        = formatItemTitle(item)
  const subtitle     = item.author ?? item.director ?? item.podcastHost ?? null
  const consumedLine = buildConsumedLine(item)

  const SERVICE_LABEL: Record<string, string> = { imdb: 'IMDB', goodreads: 'Goodreads' }
  const externalLinks = (item.externalRefs ?? [])
    .filter(r => r.url)
    .map(r => ({ label: SERVICE_LABEL[r.service] ?? r.service, url: r.url! }))

  // ── Read mode ──────────────────────────────────────────────────────────────
  return (
    <main className="px-4 pb-24">

      {/* ── Minimal nav ── */}
      <header className="flex items-center justify-between pt-8 pb-4">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Edit
        </button>
      </header>

      {/* ── Title ── */}
      <h1 className="mb-1 text-2xl font-bold leading-tight tracking-tight">
        {title}
      </h1>

      {/* ── External links (IMDB / Goodreads) — right below title ── */}
      {externalLinks.length > 0 && (
        <div className="mb-4 flex gap-3">
          {externalLinks.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              ↗ {link.label}
            </a>
          ))}
        </div>
      )}

      {/* ── Float block: cover + author(year) + consumed + rating ── */}
      <div className={externalLinks.length === 0 ? 'mt-4' : ''}>
        {/* Cover floats right */}
        {item.coverImageUrl ? (
          <div className="float-right ml-4 mb-2">
            <Image
              src={item.coverImageUrl}
              alt={title}
              width={96}
              height={144}
              className="rounded-lg object-cover shadow-sm"
            />
          </div>
        ) : (
          <div className="float-right ml-4 mb-2 flex h-36 w-24 items-center justify-center rounded-lg bg-muted text-muted-foreground/40">
            <MediaTypeIcon type={item.mediaType} className="h-8 w-8" />
          </div>
        )}

        {/* Author/Director (year) */}
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}{item.releaseYear ? ` (${item.releaseYear})` : ''}
          </p>
        )}

        {/* Consumed: date · format/where */}
        <p className={cn('text-sm text-muted-foreground', subtitle ? 'mt-0.5' : '')}>
          {consumedLine}
        </p>

        {/* Rating */}
        <div className="mt-3">
          <RatingHearts
            rating={item.rating ?? undefined}
            onChange={(rating) => updateItem(id, { rating })}
            size="md"
          />
        </div>

        <div className="clear-right" />
      </div>

      {/* ── Description (external, from OMDB/Google Books) ── */}
      {item.description && (
        <>
          <div className="my-5 border-t border-border/40" />
          <p className="text-sm leading-relaxed text-muted-foreground/80">
            {item.description}
          </p>
        </>
      )}

      {/* ── Personal notes ── */}
      {item.notes && (
        <>
          <div className="my-5 border-t border-border/40" />
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            {item.notes}
          </p>
        </>
      )}

      {/* ── Genres / tags ── */}
      {item.genres && item.genres.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {item.genres.map(genre => (
            <span
              key={genre}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* ── Status action ── */}
      <div className="mt-8">
        {item.status === 'done' ? (
          <button
            onClick={handleToggleStatus}
            className="text-xs text-muted-foreground/60 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
          >
            ↩ Move back to want list
          </button>
        ) : (
          <button
            onClick={handleToggleStatus}
            className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-primary-foreground transition-opacity active:opacity-80"
          >
            Mark as consumed
          </button>
        )}
      </div>
    </main>
  )
}
