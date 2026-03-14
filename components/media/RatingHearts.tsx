'use client'

import { HeartIcon } from '@/components/icons/AppIcons'

/**
 * RatingHearts — 6-point heart rating widget.
 *
 * Interactive: tap a heart to set that rating; tap the current rating to clear.
 * Read-only: pass readOnly to render a static display (used in MediaCard).
 *
 * Filled hearts are solid foreground colour; empty hearts are the same shape at low opacity.
 */

interface RatingHeartsProps {
  rating?: number                              // 1–6, or undefined = no rating
  onChange?: (rating: number | undefined) => void
  readOnly?: boolean
  size?: 'xs' | 'sm' | 'md'
  muted?: boolean
}

const TOTAL = 6

export function RatingHearts({
  rating,
  onChange,
  readOnly = false,
  size = 'md',
  muted = false,
}: RatingHeartsProps) {
  function handleClick(position: number) {
    if (readOnly || !onChange) return
    // Tap the already-filled heart → clear; otherwise set
    onChange(position === rating ? undefined : position)
  }

  const iconSize = size === 'xs' ? 'h-2.5 w-auto' : size === 'sm' ? 'h-3.5 w-auto' : 'h-5 w-auto'
  const gap = size === 'xs' ? 'gap-0.5' : size === 'sm' ? 'gap-0.5' : 'gap-1'

  return (
    <div className={`flex items-center ${gap}`} aria-label={`Rating: ${rating ?? 'none'} out of ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => {
        const position = i + 1
        const filled = rating !== undefined && position <= rating
        return (
          <button
            key={position}
            type="button"
            onClick={() => handleClick(position)}
            disabled={readOnly}
            aria-label={`Rate ${position}`}
            className={[
              'transition-transform',
              readOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-125 active:scale-110',
              filled
                ? (muted ? 'text-foreground/40' : 'text-foreground')
                : (muted ? 'text-foreground/10' : 'text-foreground/20'),
            ].join(' ')}
          >
            <HeartIcon className={iconSize} />
          </button>
        )
      })}
    </div>
  )
}
