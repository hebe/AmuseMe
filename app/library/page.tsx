'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/nav/PageHeader'
import { MediaCard } from '@/components/media/MediaCard'
import { QuickLogDrawer } from '@/components/media/QuickLogDrawer'
import { useMediaItems } from '@/hooks/useMediaItems'
import { cn } from '@/lib/utils'
import type { MediaItem, MediaStatus, MediaType } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = MediaType | 'all'

type YearGroup = { year: number | null; items: MediaItem[] }

function groupByYear(items: MediaItem[]): YearGroup[] {
  const map = new Map<number | null, MediaItem[]>()
  for (const item of items) {
    const year = item.consumedYear ?? null
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(item)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === null) return 1
      if (b === null) return -1
      return b - a // newest first
    })
    .map(([year, items]) => ({ year, items }))
}

// ─── Config ───────────────────────────────────────────────────────────────────

const mediaFilters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'book', label: 'Books' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv_season', label: 'TV' },
  { value: 'podcast', label: 'Podcasts' },
]

// Friendly empty state copy for every status × filter combination
const emptyMessages: Record<MediaStatus, Record<FilterType, { heading: string; cta: string }>> = {
  want: {
    all:       { heading: "Nothing saved yet.",      cta: "What's caught your eye lately?" },
    book:      { heading: "Nothing to read yet.",    cta: "What's caught your eye lately?" },
    movie:     { heading: "No movies saved.",        cta: "Heard about something good?" },
    tv_season: { heading: "No shows saved.",         cta: "Got a tip from someone?" },
    podcast:   { heading: "No podcasts saved.",      cta: "What are you curious about?" },
  },
  done: {
    all:       { heading: "Nothing logged yet.",     cta: "Seen or read anything good recently?" },
    book:      { heading: "No books logged yet.",    cta: "Read anything good recently?" },
    movie:     { heading: "No movies logged.",       cta: "Seen anything good recently?" },
    tv_season: { heading: "No seasons logged.",      cta: "Finished anything recently?" },
    podcast:   { heading: "No podcasts logged.",     cta: "Been listening to anything?" },
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [status, setStatus] = useState<MediaStatus>('want')
  const [filter, setFilter] = useState<FilterType>('all')
  const [loggingItem, setLoggingItem] = useState<MediaItem | null>(null)
  const { items, updateItem } = useMediaItems()

  // Apply both filters simultaneously
  const filtered = items.filter(
    (item) =>
      item.status === status &&
      (filter === 'all' || item.mediaType === filter)
  )

  function handleToggleStatus(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    if (item.status === 'want') {
      // want → done: open quick-log drawer to capture date + notes
      setLoggingItem(item)
    } else {
      // done → want: immediate, no form needed
      updateItem(id, { status: 'want', dateConsumed: undefined, consumedYear: undefined })
    }
  }

  function handleLog(patch: { dateConsumed: string; consumedYear: number; notes?: string }) {
    if (!loggingItem) return
    updateItem(loggingItem.id, { status: 'done', ...patch })
    setLoggingItem(null)
  }

  const emptyMsg = emptyMessages[status][filter]

  return (
    <main className="flex flex-col px-4">
      <PageHeader title="Library" />

      {/* ── Want / Done segmented control ──────────────────────── */}
      <div className="mt-2 flex rounded-xl bg-muted p-1">
        {(['want', 'done'] as MediaStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors',
              status === s
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 'want' ? 'Want' : 'Done'}
          </button>
        ))}
      </div>

      {/* ── Media type filter strip ─────────────────────────────── */}
      {/*
       * [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
       * hides the scrollbar on all browsers while keeping the scroll behaviour.
       */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mediaFilters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              filter === value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      <div className="mt-4 pb-8">
        {filtered.length === 0 ? (
          <EmptyState heading={emptyMsg.heading} cta={emptyMsg.cta} status={status} />
        ) : status === 'done' ? (
          // Done list: grouped by consumed year, newest first
          <div className="flex flex-col gap-6">
            {groupByYear(filtered).map(({ year, items: groupItems }) => (
              <section key={year ?? 'unknown'}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {year ?? '—'}
                </p>
                <ul className="flex flex-col gap-2">
                  {groupItems.map((item) => (
                    <li key={item.id}>
                      <MediaCard item={item} onToggleStatus={handleToggleStatus} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          // Want list: flat
          <ul className="flex flex-col gap-2">
            {filtered.map((item) => (
              <li key={item.id}>
                <MediaCard item={item} onToggleStatus={handleToggleStatus} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Quick-log drawer ────────────────────────────────────── */}
      {loggingItem && (
        <QuickLogDrawer
          item={loggingItem}
          onClose={() => setLoggingItem(null)}
          onLog={handleLog}
        />
      )}
    </main>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  heading,
  cta,
  status,
}: {
  heading: string
  cta: string
  status: MediaStatus
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-sm font-medium">{heading}</p>
      <p className="text-sm text-muted-foreground">{cta}</p>
      <Link
        href={`/add?status=${status}`}
        className="mt-3 text-sm font-medium underline underline-offset-2"
      >
        Tap + to add something
      </Link>
    </div>
  )
}
