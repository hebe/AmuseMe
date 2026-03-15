'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { MediaTypeIcon } from '@/components/media/MediaTypeIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RecommendationSuggestion } from '@/lib/types'

const mediaTypeLabel: Record<string, string> = {
  book:      'Book',
  movie:     'Film',
  tv_season: 'TV',
  podcast:   'Podcast',
}

interface RecommendationCardProps {
  suggestion:  RecommendationSuggestion
  onSave?:     (suggestion: RecommendationSuggestion) => Promise<void>
  alreadySaved?: boolean
}

export function RecommendationCard({
  suggestion,
  onSave,
  alreadySaved = false,
}: RecommendationCardProps) {
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(alreadySaved)

  async function handleSave() {
    if (saved || saving || !onSave) return
    setSaving(true)
    try {
      await onSave(suggestion)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* ── Header: cover + title ─────────────────────────────────────── */}
      <div className="flex gap-3 p-3">
        {/* Cover image or icon placeholder */}
        <div className="shrink-0">
          {suggestion.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={suggestion.coverImageUrl}
              alt=""
              className="h-20 w-14 rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <MediaTypeIcon type={suggestion.mediaType} className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Title + subtitle + type badge */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <p className="text-sm font-semibold leading-snug">{suggestion.title}</p>
          {suggestion.subtitle && (
            <p className="truncate text-xs text-muted-foreground">{suggestion.subtitle}</p>
          )}

          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <MediaTypeIcon type={suggestion.mediaType} className="h-2.5 w-2.5" />
              {mediaTypeLabel[suggestion.mediaType] ?? suggestion.mediaType}
            </span>
            {suggestion.isFromWantList && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                On your list
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Why this for you ──────────────────────────────────────────── */}
      <div className="border-t border-border/50 bg-muted/30 px-3 py-2.5">
        <p className="text-xs leading-relaxed text-foreground/80">
          <span className="font-medium text-foreground">Why this for you: </span>
          {suggestion.whyThisForYou}
        </p>
      </div>

      {/* ── Description (if available) ────────────────────────────────── */}
      {suggestion.description && (
        <div className="px-3 pb-2 pt-1">
          <p className="line-clamp-2 text-xs text-muted-foreground">{suggestion.description}</p>
        </div>
      )}

      {/* ── Footer: save button or already-on-list indicator ─────────── */}
      <div className={cn('px-3 pb-3', !suggestion.description && 'pt-0')}>
        {suggestion.isFromWantList ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-primary" />
            Already on your want list
          </p>
        ) : (
          <Button
            variant={saved ? 'outline' : 'default'}
            size="sm"
            className="w-full"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Saved to want list
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : 'Save to want list'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
