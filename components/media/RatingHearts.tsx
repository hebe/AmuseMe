'use client'

/**
 * RatingHearts — 6-point heart rating widget.
 *
 * Interactive: tap a heart to set that rating; tap the current rating to clear.
 * Read-only: pass readOnly to render a static display (used in MediaCard).
 *
 * Filled hearts are rose-coloured; empty hearts are muted.
 */

interface RatingHeartsProps {
  rating?: number                              // 1–6, or undefined = no rating
  onChange?: (rating: number | undefined) => void
  readOnly?: boolean
  size?: 'sm' | 'md'
}

const TOTAL = 6

export function RatingHearts({
  rating,
  onChange,
  readOnly = false,
  size = 'md',
}: RatingHeartsProps) {
  function handleClick(position: number) {
    if (readOnly || !onChange) return
    // Tap the already-filled heart → clear; otherwise set
    onChange(position === rating ? undefined : position)
  }

  const textSize = size === 'sm' ? 'text-xs' : 'text-lg'
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1'

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
              textSize,
              'leading-none transition-transform',
              readOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-125 active:scale-110',
              filled ? 'text-rose-400' : 'text-foreground/20',
            ].join(' ')}
          >
            {filled ? '♥' : '♡'}
          </button>
        )
      })}
    </div>
  )
}
