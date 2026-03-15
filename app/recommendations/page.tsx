'use client'

/**
 * Recommendations page — M5.
 *
 * Layout
 * ──────
 *  1. Taste profile card — short summary + "Regenerate" button
 *     (if no profile yet: CTA to generate one)
 *  2. Optional mood input
 *  3. "Amuse me" button → calls /api/recommendations
 *  4. Result cards, grouped: want-list surface first, then external by media type
 */

import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/nav/PageHeader'
import { Button } from '@/components/ui/button'
import { RecommendationCard } from '@/components/recommendations/RecommendationCard'
import { useMediaItemsContext } from '@/contexts/MediaItemsContext'
import type { MediaType, RecommendationSuggestion, UserTasteProfile } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mediaTypeLabel: Record<MediaType, string> = {
  book:      'Books',
  movie:     'Films',
  tv_season: 'TV Series',
  podcast:   'Podcasts',
}

// Media-type order for external suggestions section
const MEDIA_TYPE_ORDER: MediaType[] = ['book', 'movie', 'tv_season', 'podcast']

function groupExternal(suggestions: RecommendationSuggestion[]) {
  const external = suggestions.filter(s => !s.isFromWantList)
  return MEDIA_TYPE_ORDER
    .map(type => ({
      type,
      label: mediaTypeLabel[type],
      items: external.filter(s => s.mediaType === type),
    }))
    .filter(g => g.items.length > 0)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const { addItem }             = useMediaItemsContext()
  const [profile,    setProfile]    = useState<UserTasteProfile | null | undefined>(undefined)
  const [profileLoading, setProfileLoading] = useState(false)
  const [recs,       setRecs]       = useState<RecommendationSuggestion[] | null>(null)
  const [recsLoading, setRecsLoading] = useState(false)
  const [mood,       setMood]       = useState('')
  const [savedIds,   setSavedIds]   = useState<Set<string>>(new Set())
  const resultsRef = useRef<HTMLDivElement>(null)

  // Parse a fetch Response safely — reads as text first so an empty or HTML
  // body produces a clean error message rather than a raw JS exception.
  async function safeJson(res: Response, fallback: string) {
    const text = await res.text()
    let data: Record<string, unknown> = {}
    try { data = JSON.parse(text) } catch {
      throw new Error(res.ok ? fallback : `Server error (${res.status}) — please try again`)
    }
    if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : fallback)
    return data
  }

  // Load existing profile on mount
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(({ profile }) => setProfile(profile ?? null))
      .catch(() => setProfile(null))
  }, [])

  async function handleGenerateProfile() {
    setProfileLoading(true)
    try {
      const res  = await fetch('/api/profile', { method: 'POST' })
      const data = await safeJson(res, 'Failed to generate profile')
      setProfile(data.profile as UserTasteProfile)
      toast.success('Taste profile generated!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handleAmuse() {
    if (!profile) return
    setRecsLoading(true)
    setRecs(null)
    try {
      const res  = await fetch('/api/recommendations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mood: mood.trim() || null }),
      })
      const data = await safeJson(res, 'Failed to get recommendations')
      setRecs(data.suggestions as RecommendationSuggestion[])
      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setRecsLoading(false)
    }
  }

  async function handleSave(suggestion: RecommendationSuggestion) {
    const id  = `mi-rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()

    const item = {
      id,
      title:        suggestion.title,
      mediaType:    suggestion.mediaType,
      status:       'want' as const,
      author:       suggestion.mediaType === 'book'    ? suggestion.subtitle : undefined,
      director:     suggestion.mediaType === 'movie'   ? suggestion.subtitle : undefined,
      podcastHost:  suggestion.mediaType === 'podcast' ? suggestion.subtitle : undefined,
      coverImageUrl: suggestion.coverImageUrl,
      description:   suggestion.description,
      dateAdded:    now,
      createdAt:    now,
      updatedAt:    now,
    }

    addItem(item)
    setSavedIds(prev => new Set([...prev, suggestion.title]))
    toast.success(`"${suggestion.title}" added to want list`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const fromWantList = recs?.filter(s => s.isFromWantList) ?? []
  const externalGroups = recs ? groupExternal(recs) : []
  const profileAge = profile?.generatedAt
    ? Math.round((Date.now() - new Date(profile.generatedAt).getTime()) / 86_400_000)
    : null

  return (
    <main className="px-4 pb-6">
      <PageHeader title="Recommendations" />

      {/* ── Taste profile card ─────────────────────────────────────────── */}
      <section className="mt-4">
        {profile === undefined ? (
          // Loading skeleton
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
          </div>
        ) : profile === null ? (
          // No profile yet
          <div className="rounded-xl border border-border bg-card p-4 text-center space-y-3">
            <p className="text-sm font-medium">Start with your taste profile</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AmuseMe will analyse your full consumption history to understand what you love
              — then use that to make genuinely personalised recommendations.
            </p>
            <Button
              onClick={handleGenerateProfile}
              disabled={profileLoading}
              className="w-full"
            >
              {profileLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing your history…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate taste profile</>
              )}
            </Button>
            {profileLoading && (
              <p className="text-[11px] text-muted-foreground">This takes ~15 seconds</p>
            )}
          </div>
        ) : (
          // Has profile
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your taste profile
              </p>
              {profileAge !== null && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {profileAge === 0 ? 'Generated today' : `${profileAge}d ago`}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{profile.summaryText}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateProfile}
              disabled={profileLoading}
            >
              {profileLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Regenerating…</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Regenerate</>
              )}
            </Button>
          </div>
        )}
      </section>

      {/* ── Mood input + Amuse me button ───────────────────────────────── */}
      {profile && (
        <section className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="mood" className="text-xs font-medium text-muted-foreground">
              What are you in the mood for? <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="mood"
              rows={2}
              value={mood}
              onChange={e => setMood(e.target.value)}
              placeholder="e.g. something cozy but not cheesy, or a film to watch with my partner"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            onClick={handleAmuse}
            disabled={recsLoading}
            size="lg"
            className="w-full"
          >
            {recsLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Finding recommendations…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Amuse me</>
            )}
          </Button>
          {recsLoading && (
            <p className="text-center text-[11px] text-muted-foreground">
              Gemini is reading your history — takes ~20 seconds
            </p>
          )}
        </section>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      {recs && (
        <section ref={resultsRef} className="mt-6 space-y-6">
          {/* Want-list surfacing */}
          {fromWantList.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                From your want list
              </h2>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Already saved — these match your taste {mood.trim() ? 'and mood' : 'profile'}
              </p>
              <div className="space-y-3">
                {fromWantList.map((s, i) => (
                  <RecommendationCard
                    key={`wl-${i}`}
                    suggestion={s}
                    alreadySaved
                  />
                ))}
              </div>
            </div>
          )}

          {/* External suggestions grouped by media type */}
          {externalGroups.map(group => (
            <div key={group.type} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.items.map((s, i) => (
                  <RecommendationCard
                    key={`ext-${group.type}-${i}`}
                    suggestion={s}
                    alreadySaved={savedIds.has(s.title)}
                    onSave={handleSave}
                  />
                ))}
              </div>
            </div>
          ))}

          {fromWantList.length === 0 && externalGroups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recommendations generated — try again or adjust your mood input.
            </p>
          )}
        </section>
      )}
    </main>
  )
}
