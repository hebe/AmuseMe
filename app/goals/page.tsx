'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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

  const [expandedYear, setExpandedYear] = useState<number | null>(CURRENT_YEAR)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Current year always present; past years with goals below it
  const yearsWithGoals = [...new Set(goals.map((g) => g.year))]
  const allYears = [...new Set([CURRENT_YEAR, ...yearsWithGoals])].sort((a, b) => b - a)

  function startEditing(year: number, type: MediaType, currentTarget: number) {
    setEditingKey(`${year}-${type}`)
    setEditValue(currentTarget > 0 ? String(currentTarget) : '')
  }

  function commitEdit(year: number, type: MediaType) {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(year, type, parsed)
    }
    setEditingKey(null)
  }

  function toggleYear(year: number) {
    setEditingKey(null)
    setExpandedYear((prev) => (prev === year ? null : year))
  }

  return (
    <main className="px-4 pb-8">
      <PageHeader title="Goals" />

      <div className="flex flex-col">
        {allYears.map((year) => {
          const isExpanded = expandedYear === year
          const isCurrentYear = year === CURRENT_YEAR

          return (
            <div key={year} className="border-t border-border">
              <button
                onClick={() => toggleYear(year)}
                className="flex w-full items-center justify-between py-4 text-base transition-colors hover:text-foreground"
              >
                <span className={`font-medium ${isExpanded ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {year}
                </span>
                {isExpanded
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-8 pb-8">
                  {MEDIA_TYPES.map(({ type, label }) => {
                    const { consumed, target, percent } = getGoalProgress(year, type, items, goals)
                    const isEditing = editingKey === `${year}-${type}`

                    return (
                      <div key={type} className="flex flex-col gap-2.5">
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
                                  onBlur={() => commitEdit(year, type)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur()
                                    if (e.key === 'Escape') setEditingKey(null)
                                  }}
                                  className="w-16 rounded border border-foreground/25 bg-transparent px-2 py-0.5 text-right text-base text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/40"
                                />
                              ) : (
                                <button
                                  onClick={() => startEditing(year, type, target)}
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

                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground transition-[width] duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  {isCurrentYear && (
                    <p className="text-xs text-muted-foreground">Tap the target number to edit it.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div className="border-t border-border" />
      </div>

      {/* ── History chart ── */}
      <div className="mt-12">
        <p className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
          History
        </p>
        <ConsumptionChart items={items} />
      </div>
    </main>
  )
}
