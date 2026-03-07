'use client'

import { useState } from 'react'
import { consumptionGoals as initialGoals, mediaItems } from '@/lib/mock-data'
import type { ConsumptionGoal, MediaType } from '@/lib/types'

/**
 * Local state hook for consumption goals.
 * Seeded from mock data — swap the initialiser for a DB fetch in M4+.
 */
export function useGoals() {
  const [goals, setGoals] = useState<ConsumptionGoal[]>(initialGoals)

  function setGoal(year: number, mediaType: MediaType, target: number): void {
    setGoals((prev) => {
      const existing = prev.find((g) => g.year === year && g.mediaType === mediaType)
      if (existing) {
        return prev.map((g) =>
          g.year === year && g.mediaType === mediaType ? { ...g, target } : g
        )
      }
      const newGoal: ConsumptionGoal = {
        id: `cg-${year}-${mediaType}`,
        year,
        mediaType,
        target,
      }
      return [...prev, newGoal]
    })
  }

  function getProgress(
    year: number,
    mediaType: MediaType
  ): { consumed: number; target: number; pct: number } {
    const goal = goals.find((g) => g.year === year && g.mediaType === mediaType)
    const target = goal?.target ?? 0
    const consumed = mediaItems.filter(
      (item) =>
        item.mediaType === mediaType &&
        item.status === 'done' &&
        item.consumedYear === year
    ).length
    const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
    return { consumed, target, pct }
  }

  return { goals, setGoal, getProgress }
}
