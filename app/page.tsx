'use client'

/**
 * Dashboard — converted from server component to client component so it can
 * read live data from MediaItemsContext and GoalsContext (both hydrated with
 * server-fetched data from layout.tsx, so there's still no loading flash).
 *
 * Changes from the mock-data version:
 *   - `consumptionGoals` → `goals` from useGoals()
 *   - `mediaItems`       → `items` from useMediaItemsContext()
 *   - `recentItems(3)`   → computed inline (sort by dateConsumed ?? dateAdded)
 */

import Link from 'next/link'
import { useMediaItemsContext } from '@/contexts/MediaItemsContext'
import { useGoals } from '@/hooks/useGoals'
import { getGoalProgress } from '@/lib/utils'
import { MediaCard } from '@/components/media/MediaCard'
import type { MediaType } from '@/lib/types'

const CURRENT_YEAR = 2026

const mediaLabels: Record<MediaType, string> = {
  book:      'Books',
  movie:     'Movies',
  tv_season: 'TV seasons',
  podcast:   'Podcasts',
}
export default function DashboardPage() {
  const { items, updateItem } = useMediaItemsContext()
  const { goals }  = useGoals()

  const currentGoals = goals.filter((g) => g.year === CURRENT_YEAR)

  const recent = [...items]
    .sort((a, b) => {
      const dateA = a.dateConsumed ?? a.dateAdded
      const dateB = b.dateConsumed ?? b.dateAdded
      return dateB.localeCompare(dateA)
    })
    .slice(0, 3)

  return (
    <main className="flex flex-col gap-8 px-4 pt-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="" aria-hidden="true" className="h-7 w-auto" />
          AmuseMe
        </h1>
      </header>

      {/* ── Goals widget ───────────────────────────────────────── */}
      <section aria-labelledby="goals-heading">
        <Link
          href="/goals"
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
        >
          <div className="flex items-baseline justify-between">
            <h2 id="goals-heading" className="text-sm font-medium">
              {CURRENT_YEAR} goals
            </h2>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              View all →
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {currentGoals.map((goal) => {
              const { consumed, target, percent } = getGoalProgress(
                CURRENT_YEAR,
                goal.mediaType,
                items,
                goals
              )
              return (
                <div key={goal.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{mediaLabels[goal.mediaType]}</span>
                    <span className="tabular-nums">
                      {consumed} / {target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Link>
      </section>

      {/* ── Recent activity ────────────────────────────────────── */}
      {/* Future (M5): this section becomes the "Amuse me!" recommendations entry point */}
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-sm font-medium">
          Recent activity
        </h2>
        <ul className="flex flex-col gap-2">
          {recent.map((item) => (
            <li key={item.id}>
              <MediaCard
                item={item}
                onToggleStatus={(id) => {
                  const toggled = item.status === 'done' ? 'want' : 'done'
                  const now = new Date().toISOString()
                  updateItem(id, {
                    status: toggled,
                    dateConsumed: toggled === 'done' ? now : undefined,
                    consumedYear: toggled === 'done' ? new Date(now).getFullYear() : undefined,
                  })
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Quick actions ──────────────────────────────────────── */}
      <section aria-label="Quick actions" className="flex gap-3">
        <Link
          href="/add?status=done"
          className="flex flex-1 items-center justify-center rounded-xl border border-border bg-card py-4 text-sm font-medium transition-colors hover:border-foreground/20 active:bg-muted"
        >
          ✓ Log as consumed
        </Link>
        <Link
          href="/add?status=want"
          className="flex flex-1 items-center justify-center rounded-xl bg-foreground py-4 text-sm font-medium text-background transition-opacity hover:opacity-90 active:opacity-80"
        >
          + Save recommendation
        </Link>
      </section>
    </main>
  )
}
