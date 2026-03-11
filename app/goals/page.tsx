'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/nav/PageHeader'
import { ConsumptionChart } from '@/components/goals/ConsumptionChart'
import { useGoals } from '@/hooks/useGoals'
import { useMediaItemsContext } from '@/contexts/MediaItemsContext'
import { getGoalProgress } from '@/lib/utils'
import type { MediaType } from '@/lib/types'

const CURRENT_YEAR = 2026

const MEDIA_TYPES: { type: MediaType; label: string }[] = [
  { type: 'book', label: 'Books' },
  { type: 'movie', label: 'Movies' },
  { type: 'tv_season', label: 'TV seasons' },
  { type: 'podcast', label: 'Podcasts' },
]

export default function GoalsPage() {
  const { goals, setGoal } = useGoals()
  const { items } = useMediaItemsContext()

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // All years that have at least one goal defined, newest first
  const availableYears = [...new Set(goals.map((g) => g.year))].sort((a, b) => b - a)
  const otherYears = availableYears.filter((y) => y !== selectedYear)

  const isCurrentYear = selectedYear === CURRENT_YEAR

  function startEditing(type: MediaType, currentTarget: number) {
    setEditingKey(`${selectedYear}-${type}`)
    setEditValue(currentTarget > 0 ? String(currentTarget) : '')
  }

  function commitEdit(type: MediaType) {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(selectedYear, type, parsed)
    }
    setEditingKey(null)
  }

  function switchYear(year: number) {
    setEditingKey(null) // dismiss any open input
    setSelectedYear(year)
  }

  return (
    <main className="px-4 pb-8">
      <PageHeader title="Goals" />

      {/* ── Selected year ── */}
      <p className="mb-8 text-sm text-muted-foreground">{selectedYear}</p>

      <div className="flex flex-col gap-8">
        {MEDIA_TYPES.map(({ type, label }) => {
          const { consumed, target, percent } = getGoalProgress(selectedYear, type, items, goals)
          const isEditing = editingKey === `${selectedYear}-${type}`

          return (
            <div key={type} className="flex flex-col gap-2.5">
              {/* Label + count row */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-medium">{label}</span>

                <div className="flex items-baseline gap-1.5 text-base tabular-nums text-muted-foreground">
                  <span>{consumed}</span>
                  <span>/</span>
                  {isCurrentYear ? (
                    isEditing ? (
                      <input
                        type="number"
                        min={1}
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => commitEdit(type)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur()
                          if (e.key === 'Escape') setEditingKey(null)
                        }}
                        className="w-16 rounded border border-foreground/25 bg-transparent px-2 py-0.5 text-right text-base text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/40"
                      />
                    ) : (
                      <button
                        onClick={() => startEditing(type, target)}
                        className="-mx-1 rounded px-1 py-0.5 transition-colors hover:bg-muted"
                        title="Tap to edit target"
                      >
                        {target > 0 ? target : '–'}
                      </button>
                    )
                  ) : (
                    <span>{target > 0 ? target : '–'}</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {isCurrentYear && (
        <p className="mt-10 text-xs text-muted-foreground">Tap the target number to edit it.</p>
      )}

      {/* ── History chart ── */}
      <div className="mt-12">
        <p className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
          History
        </p>
        <ConsumptionChart items={items} />
      </div>

      {/* ── Other years ── */}
      {otherYears.length > 0 && (
        <div className="mt-12 flex flex-col">
          {otherYears.map((year) => (
            <button
              key={year}
              onClick={() => switchYear(year)}
              className="flex items-center justify-between border-t border-border py-4 text-base text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="font-medium">{year}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
