'use client'

import Link from 'next/link'
import { MediaTypeIcon } from './MediaTypeIcon'
import { RatingHearts } from './RatingHearts'
import { cn, formatItemTitle } from '@/lib/utils'
import type { MediaItem } from '@/lib/types'

interface MediaCardProps {
  item: MediaItem
  onToggleStatus: (id: string) => void
}

export function MediaCard({ item, onToggleStatus }: MediaCardProps) {
  // Show the most relevant secondary line depending on media type
  const subtitle = item.author ?? item.director ?? item.podcastHost ?? null

  return (
    <div className="relative flex items-center rounded-xl border border-border bg-card">
      {/*
       * Main tap area → item detail.
       * pr-20 reserves space so text never overlaps the status badge.
       * Using a Link here (not wrapping the whole div) keeps the button
       * outside the interactive element — valid HTML, accessible.
       */}
      <Link
        href={`/item/${item.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 pr-20"
      >
        <span className="shrink-0 text-muted-foreground">
          <MediaTypeIcon type={item.mediaType} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{formatItemTitle(item)}</p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
          {item.status === 'done' && (
            <div className="mt-1">
              <RatingHearts rating={item.rating ?? undefined} readOnly size="xs" muted />
            </div>
          )}
        </div>
      </Link>

      {/*
       * Status toggle — sits outside the Link so it doesn't trigger navigation.
       * Tapping flips want ↔ done instantly (optimistic — state updates in the hook).
       */}
      <button
        onClick={() => onToggleStatus(item.id)}
        className={cn(
          'absolute right-3 shrink-0 transition-colors',
          item.status === 'done'
            ? 'p-2 text-muted-foreground/40 hover:text-muted-foreground'
            : 'rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-foreground/10'
        )}
        aria-label={item.status === 'done' ? 'Move back to want list' : 'Mark as done'}
      >
        {item.status === 'done' ? '✓' : 'Done'}
      </button>
    </div>
  )
}
