'use client'

/**
 * Book enrichment validation page — local dev only.
 * Run scripts/fetch-book-enrichment.ts first to populate the candidates file,
 * then visit http://localhost:3001/admin/enrich to review and accept/skip.
 */

import { useEffect, useState, useCallback } from 'react'
import type { EnrichmentCandidate } from '@/scripts/fetch-book-enrichment'

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'pending' | 'accepted' | 'skipped' | 'no-match' | 'all'

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, active, onClick }: {
  label: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-foreground text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-foreground/10'
      }`}
    >
      {label} <span className="opacity-70">{value}</span>
    </button>
  )
}

function CandidateRow({ candidate, onAccept, onSkip }: {
  candidate: EnrichmentCandidate
  onAccept: (id: string) => void
  onSkip:   (id: string) => void
}) {
  const { itemId, itemTitle, itemAuthor, status, match } = candidate
  const isDone = status === 'accepted' || status === 'skipped'

  return (
    <div className={`flex items-center gap-3 border-b border-border py-3 last:border-0 ${
      isDone ? 'opacity-40' : ''
    }`}>

      {/* Cover thumbnail */}
      <div className="shrink-0">
        {match?.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.coverImageUrl}
            alt={itemTitle}
            className="h-16 w-11 rounded object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-11 items-center justify-center rounded bg-muted text-muted-foreground">
            <span className="text-lg">📖</span>
          </div>
        )}
      </div>

      {/* Item info (what we have) */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{itemTitle}</p>
        {itemAuthor && (
          <p className="truncate text-xs text-muted-foreground">{itemAuthor}</p>
        )}
        {match ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {match.releaseYear && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {match.releaseYear}
              </span>
            )}
            {match.genres.slice(0, 3).map(g => (
              <span key={g} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {g}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground italic">No Open Library match</p>
        )}
      </div>

      {/* OL match title (if different from item title) */}
      {match && match.olTitle.toLowerCase() !== itemTitle.toLowerCase() && (
        <div className="hidden shrink-0 max-w-[160px] sm:block">
          <p className="truncate text-xs text-muted-foreground italic">
            OL: &ldquo;{match.olTitle}&rdquo;
          </p>
        </div>
      )}

      {/* Status / actions */}
      <div className="shrink-0">
        {status === 'accepted' && (
          <span className="text-xs font-medium text-green-600">✓ Accepted</span>
        )}
        {status === 'skipped' && (
          <span className="text-xs text-muted-foreground">Skipped</span>
        )}
        {status === 'pending' && (
          <div className="flex gap-2">
            {match && (
              <button
                onClick={() => onAccept(itemId)}
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity active:opacity-80"
              >
                Accept
              </button>
            )}
            <button
              onClick={() => onSkip(itemId)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnrichPage() {
  const [candidates, setCandidates] = useState<EnrichmentCandidate[]>([])
  const [filter, setFilter]         = useState<Filter>('pending')
  const [loading, setLoading]       = useState(true)
  const [accepting, setAccepting]   = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/enrich')
    const data = await res.json() as EnrichmentCandidate[]
    setCandidates(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAccept(itemId: string) {
    await fetch('/api/admin/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', itemId }),
    })
    setCandidates(prev => prev.map(c => c.itemId === itemId ? { ...c, status: 'accepted' } : c))
  }

  async function handleSkip(itemId: string) {
    await fetch('/api/admin/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'skip', itemId }),
    })
    setCandidates(prev => prev.map(c => c.itemId === itemId ? { ...c, status: 'skipped' } : c))
  }

  async function handleAcceptAll() {
    setAccepting(true)
    const res = await fetch('/api/admin/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept-all' }),
    })
    const { accepted } = await res.json() as { accepted: number }
    setCandidates(prev => prev.map(c =>
      c.status === 'pending' && c.match ? { ...c, status: 'accepted' } : c
    ))
    setAccepting(false)
    alert(`Accepted ${accepted} books!`)
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const total    = candidates.length
  const pending  = candidates.filter(c => c.status === 'pending' && c.match !== null).length
  const accepted = candidates.filter(c => c.status === 'accepted').length
  const skipped  = candidates.filter(c => c.status === 'skipped').length
  const noMatch  = candidates.filter(c => c.match === null).length

  // ── Filtered list ────────────────────────────────────────────────────────
  const visible = candidates.filter(c => {
    if (filter === 'pending')  return c.status === 'pending' && c.match !== null
    if (filter === 'accepted') return c.status === 'accepted'
    if (filter === 'skipped')  return c.status === 'skipped'
    if (filter === 'no-match') return c.match === null
    return true
  })

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Loading candidates…</p>
      </main>
    )
  }

  if (total === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-xl font-bold">Book enrichment</h1>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">No candidates file found.</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            npx tsx --env-file=.env.local scripts/fetch-book-enrichment.ts
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Book enrichment</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} books · review Open Library matches before writing to DB
          </p>
        </div>
        {pending > 0 && (
          <button
            onClick={handleAcceptAll}
            disabled={accepting}
            className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50 active:opacity-80"
          >
            {accepting ? 'Accepting…' : `Accept all ${pending}`}
          </button>
        )}
      </div>

      {/* ── Filter pills ── */}
      <div className="mb-4 flex flex-wrap gap-2">
        <StatPill label="Pending"  value={pending}  active={filter === 'pending'}  onClick={() => setFilter('pending')} />
        <StatPill label="Accepted" value={accepted} active={filter === 'accepted'} onClick={() => setFilter('accepted')} />
        <StatPill label="Skipped"  value={skipped}  active={filter === 'skipped'}  onClick={() => setFilter('skipped')} />
        <StatPill label="No match" value={noMatch}  active={filter === 'no-match'} onClick={() => setFilter('no-match')} />
        <StatPill label="All"      value={total}    active={filter === 'all'}      onClick={() => setFilter('all')} />
      </div>

      {/* ── List ── */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nothing to show here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-4">
          {visible.map(c => (
            <CandidateRow
              key={c.itemId}
              candidate={c}
              onAccept={handleAccept}
              onSkip={handleSkip}
            />
          ))}
        </div>
      )}
    </main>
  )
}
