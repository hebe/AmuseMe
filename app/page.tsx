import Link from 'next/link'
import { consumptionGoals, countConsumed, recentItems } from '@/lib/mock-data'
import type { MediaType } from '@/lib/types'

const CURRENT_YEAR = 2026

const mediaLabels: Record<MediaType, string> = {
  book: 'Books',
  movie: 'Movies',
  tv_season: 'TV seasons',
  podcast: 'Podcasts',
}

export default function DashboardPage() {
  const today = new Date(2026, 2, 7) // mock-stable date
  const dateLabel = today.toLocaleDateString('no-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const currentGoals = consumptionGoals.filter((g) => g.year === CURRENT_YEAR)
  const recent = recentItems(3)

  return (
    <main className="flex flex-col gap-8 px-4 pt-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {dateLabel}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">AmuseMe</h1>
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
              const consumed = countConsumed(goal.mediaType, CURRENT_YEAR)
              const pct = Math.min(100, Math.round((consumed / goal.target) * 100))
              return (
                <div key={goal.id} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{mediaLabels[goal.mediaType]}</span>
                    <span className="tabular-nums">
                      {consumed} / {goal.target}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Link>
      </section>

      {/* ── Recent activity ────────────────────────────────────── */}
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-sm font-medium">
          Recent activity
        </h2>
        <ul className="flex flex-col gap-2">
          {recent.map((item) => (
            <li key={item.id}>
              <Link
                href={`/item/${item.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.author ?? item.director ?? item.podcastHost ?? ''}
                    {(item.author ?? item.director ?? item.podcastHost) && ' · '}
                    {mediaLabels[item.mediaType]}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.status === 'done'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.status === 'done' ? 'Done' : 'Want'}
                </span>
              </Link>
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
          + Save for later
        </Link>
      </section>
    </main>
  )
}
