'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
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

// ─── Search helpers ───────────────────────────────────────────────────────────

/**
 * Normalise a string for diacritic-insensitive matching.
 * NFD decomposition strips combining marks (å→a, ä→a, ö→o, é→e…).
 * ø and æ don't decompose via NFD so are handled explicitly.
 */
function normaliseForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
}

function itemMatchesQuery(item: MediaItem, normalisedQuery: string): boolean {
  const fields = [
    item.title,
    item.titleOriginal,
    item.author,
    item.director,
    item.podcastHost,
  ]
  return fields.some(
    (f) => f && normaliseForSearch(f).includes(normalisedQuery)
  )
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

// useSearchParams() requires a Suspense boundary — wrap the real content.
export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryContent />
    </Suspense>
  )
}

function LibraryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial state from URL; fall back to sensible defaults.
  const statusParam = searchParams.get('status')
  const filterParam = searchParams.get('filter')
  const [status, setStatusState] = useState<MediaStatus>(
    statusParam === 'done' ? 'done' : 'want'
  )
  const [filter, setFilterState] = useState<FilterType>(
    (['book', 'movie', 'tv_season', 'podcast'] as FilterType[]).includes(filterParam as FilterType)
      ? (filterParam as FilterType)
      : 'all'
  )
  const [loggingItem, setLoggingItem] = useState<MediaItem | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { items, updateItem } = useMediaItems()

  // Keep URL in sync so back-navigation restores the correct filters.
  function setStatus(s: MediaStatus) {
    setStatusState(s)
    router.replace(`/library?status=${s}&filter=${filter}`)
  }
  function setFilter(f: FilterType) {
    setFilterState(f)
    router.replace(`/library?status=${status}&filter=${f}`)
  }

  function toggleSearch() {
    if (searchOpen) {
      setSearchOpen(false)
      setSearchQuery('')
    } else {
      setSearchOpen(true)
    }
  }

  // Active search: query must be at least 2 chars to avoid noisy single-char results
  const normalisedQuery = normaliseForSearch(searchQuery.trim())
  const isSearching = searchOpen && normalisedQuery.length >= 2

  // Want/Done and type pills always apply — even during search.
  // Search just adds an extra text-match filter on top.
  const filtered = items
    .filter(
      (item) =>
        item.status === status &&
        (filter === 'all' || item.mediaType === filter) &&
        (!isSearching || itemMatchesQuery(item, normalisedQuery))
    )
    // In search mode: sort alphabetically so results feel like a find-in-page.
    // Normal mode preserves natural order.
    .sort(isSearching
      ? (a, b) => a.title.localeCompare(b.title)
      : () => 0
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

  function handleLog(patch: { dateConsumed: string; consumedYear: number; notes?: string; rating?: number }) {
    if (!loggingItem) return
    updateItem(loggingItem.id, { status: 'done', ...patch })
    setLoggingItem(null)
  }

  // Counts per filter type for the active status tab — drives the pill labels.
  // Intentionally not affected by the active filter or search query.
  const counts = useMemo(() => {
    const byStatus = items.filter((i) => i.status === status)
    return {
      all:       byStatus.length,
      book:      byStatus.filter((i) => i.mediaType === 'book').length,
      movie:     byStatus.filter((i) => i.mediaType === 'movie').length,
      tv_season: byStatus.filter((i) => i.mediaType === 'tv_season').length,
      podcast:   byStatus.filter((i) => i.mediaType === 'podcast').length,
    }
  }, [items, status])

  const emptyMsg = emptyMessages[status][filter]

  return (
    <main className="flex flex-col px-4">
      <PageHeader
        title="Library"
        rightAction={
          <button
            onClick={toggleSearch}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              searchOpen
                ? 'bg-foreground/10 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={searchOpen ? 'Close search' : 'Search'}
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
        }
      />

      {/* ── Inline search field — appears when searchOpen ──────── */}
      {searchOpen && (
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Want / Done segmented control ──────────────────────── */}
      <div className="mt-3 flex rounded-xl bg-muted p-1">
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
            <span className={cn(
              'ml-0.5 text-[10px]',
              filter === value ? 'opacity-70' : 'opacity-60'
            )}>
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      <div className="mt-4 pb-8">
        {isSearching ? (
          // ── Search mode: flat list across all statuses ───────────
          filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Nothing found for &ldquo;{searchQuery.trim()}&rdquo;
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              </p>
              <ul className="flex flex-col gap-2">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <MediaCard item={item} onToggleStatus={handleToggleStatus} />
                  </li>
                ))}
              </ul>
            </>
          )
        ) : filtered.length === 0 ? (
          // ── Normal mode: empty state ─────────────────────────────
          <EmptyState heading={emptyMsg.heading} cta={emptyMsg.cta} status={status} />
        ) : status === 'done' ? (
          // ── Normal mode: Done list grouped by year ───────────────
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
          // ── Normal mode: Want list flat ──────────────────────────
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
