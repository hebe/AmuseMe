'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RatingHearts } from '@/components/media/RatingHearts'
import type { MediaItem } from '@/lib/types'

interface QuickLogDrawerProps {
  item: MediaItem
  onClose: () => void
  onLog: (patch: {
    dateConsumed: string
    consumedYear: number
    notes?: string
    rating?: number
  }) => void
}

/** Parse a YYYY-MM-DD string as a local date (avoids UTC-midnight timezone shift). */
function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function QuickLogDrawer({ item, onClose, onLog }: QuickLogDrawerProps) {
  const [date, setDate] = useState(() => todayString())
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)

  function handleSubmit() {
    const localDate = parseDateLocal(date)
    onLog({
      dateConsumed: localDate.toISOString(),
      consumedYear: localDate.getFullYear(),
      notes: notes.trim() || undefined,
      rating,
    })
    toast('Logged!', { description: item.title })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Log ${item.title}`}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-foreground/10" />

        <h2 className="truncate text-base font-semibold">{item.title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">When did you finish it?</p>

        {/* Date */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium">
            Notes{' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering…"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        {/* Rating */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium">
            Rating{' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </p>
          <RatingHearts rating={rating} onChange={setRating} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Log it
          </button>
        </div>
      </div>
    </>
  )
}
