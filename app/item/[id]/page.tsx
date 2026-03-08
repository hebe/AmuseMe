'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMediaItems } from '@/hooks/useMediaItems'
import { PageHeader } from '@/components/nav/PageHeader'
import { MediaTypeIcon } from '@/components/media/MediaTypeIcon'
import { AddItemForm } from '@/components/forms/AddItemForm'
import { cn } from '@/lib/utils'
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

const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  book: 'Book',
  movie: 'Movie',
  tv_season: 'TV Season',
  podcast: 'Podcast',
}

const BOOK_FORMAT_LABEL: Record<BookFormat, string> = {
  physical: 'Physical',
  ebook: 'eBook',
  audiobook: 'Audiobook',
}

const AUDIOBOOK_SOURCE_LABEL: Record<AudiobookSource, string> = {
  bookbeat: 'Bookbeat',
  storytel: 'Storytel',
  podme: 'PodMe',
  fabel: 'Fabel',
  other: 'Other',
}

const PROVIDER_LABEL: Record<StreamingProvider, string> = {
  apple: 'Apple TV+',
  disney: 'Disney+',
  hbo: 'HBO Max',
  netflix: 'Netflix',
  nrk: 'NRK TV',
  paramount: 'Paramount+',
  prime: 'Prime Video',
  skyshowtime: 'SkyShowtime',
  tv2: 'TV 2 Play',
  viaplay: 'Viaplay',
  other: 'Other',
}

const MOVIE_VENUE_LABEL: Record<MovieVenue, string> = {
  cinema: 'Cinema',
  home: 'At home',
  other: 'Other',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (scoped to this file)
// ─────────────────────────────────────────────────────────────────────────────

/** A label/value row inside a detail section card. */
function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-right text-sm font-medium">{value}</span>
      )}
    </div>
  )
}

/** Card wrapper for a group of detail rows. */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4">
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getItemById, updateItem } = useMediaItems()
  const [isEditing, setIsEditing] = useState(false)

  const item = getItemById(id)

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!item) {
    return (
      <main className="px-4">
        <PageHeader title="Not found" backHref="/library" />
        <p className="mt-4 text-sm text-muted-foreground">
          This item doesn't exist or has been removed.
        </p>
      </main>
    )
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <main className="px-4">
        <PageHeader
          title="Edit"
          backHref={undefined}
          rightAction={
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          }
        />
        <AddItemForm editItem={item} onSaveEdit={() => setIsEditing(false)} />
      </main>
    )
  }

  // ── Status toggle ─────────────────────────────────────────────────────────
  function handleToggleStatus() {
    if (item!.status === 'done') {
      updateItem(id, { status: 'want', dateConsumed: undefined, consumedYear: undefined })
    } else {
      const now = new Date().toISOString()
      updateItem(id, {
        status: 'done',
        dateConsumed: now,
        consumedYear: new Date().getFullYear(),
      })
    }
  }

  // ── Build type-specific detail rows ──────────────────────────────────────
  const typeRows: { label: string; value: string }[] = []

  if (item.mediaType === 'book') {
    if (item.author)          typeRows.push({ label: 'Author', value: item.author })
    if (item.bookFormat)      typeRows.push({ label: 'Format', value: BOOK_FORMAT_LABEL[item.bookFormat] })
    if (item.audiobookSource) typeRows.push({ label: 'Service', value: AUDIOBOOK_SOURCE_LABEL[item.audiobookSource] })
  } else if (item.mediaType === 'movie') {
    if (item.director)   typeRows.push({ label: 'Director', value: item.director })
    if (item.provider)   typeRows.push({ label: 'Provider', value: PROVIDER_LABEL[item.provider] })
    if (item.movieVenue) typeRows.push({ label: 'Watched at', value: MOVIE_VENUE_LABEL[item.movieVenue] })
  } else if (item.mediaType === 'tv_season') {
    if (item.seasonNumber != null) typeRows.push({ label: 'Season', value: String(item.seasonNumber) })
    if (item.provider)             typeRows.push({ label: 'Provider', value: PROVIDER_LABEL[item.provider] })
  } else if (item.mediaType === 'podcast') {
    if (item.podcastHost) typeRows.push({ label: 'Host', value: item.podcastHost })
  }

  // ── Read mode ─────────────────────────────────────────────────────────────
  return (
    <main className="px-4 pb-6">
      <PageHeader
        title={item.title}
        backHref="/library"
        rightAction={
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Edit
          </button>
        }
      />

      {/* ── Type + status row ── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MediaTypeIcon type={item.mediaType} />
          <span>{MEDIA_TYPE_LABEL[item.mediaType]}</span>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            item.status === 'done'
              ? 'bg-foreground text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {item.status === 'done' ? 'Done' : 'Want'}
        </span>
      </div>

      {/* ── Type-specific details ── */}
      {typeRows.length > 0 && (
        <Section>
          {typeRows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
        </Section>
      )}

      {/* ── Source ── */}
      {(item.sourceText || item.sourceUrl) && (
        <Section>
          {item.sourceText && (
            <DetailRow label="Source" value={item.sourceText} />
          )}
          {item.sourceUrl && (
            <DetailRow label="Link" value={item.sourceUrl} href={item.sourceUrl} />
          )}
        </Section>
      )}

      {/* ── Dates ── */}
      <Section>
        <DetailRow label="Added" value={formatDate(item.dateAdded)} />
        {item.dateConsumed && (
          <DetailRow label="Consumed" value={formatDate(item.dateConsumed)} />
        )}
      </Section>

      {/* ── Notes ── */}
      {item.notes && (
        <p className="my-6 px-2 text-sm leading-relaxed text-muted-foreground italic">
          &ldquo;{item.notes}&rdquo;
        </p>
      )}

      {/* ── Status toggle ── */}
      <div className="mt-6">
        {item.status === 'done' ? (
          // Destructive-ish action — subtle styling so it's not too prominent
          <button
            onClick={handleToggleStatus}
            className="w-full rounded-xl border border-border bg-card py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:opacity-80"
          >
            Move back to want list
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
