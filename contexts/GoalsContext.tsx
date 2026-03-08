'use client'

/**
 * GoalsContext — mirrors MediaItemsContext but for consumption goals.
 *
 * Initialised with server-fetched goals passed in from layout.tsx via Providers.
 * Mutations (setGoal) update local state *optimistically* (instant UI feedback)
 * then fire a background POST to /api/goals. If the request fails, the change
 * will be lost on the next hard refresh — acceptable for a personal app.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ConsumptionGoal, MediaType } from '@/lib/types'

type GoalsContextValue = {
  goals: ConsumptionGoal[]
  setGoal: (year: number, mediaType: MediaType, target: number) => void
}

const GoalsContext = createContext<GoalsContextValue | null>(null)

export function GoalsProvider({
  children,
  initialGoals,
}: {
  children: ReactNode
  initialGoals: ConsumptionGoal[]
}) {
  const [goals, setGoals] = useState<ConsumptionGoal[]>(initialGoals)

  function setGoal(year: number, mediaType: MediaType, target: number): void {
    const existing = goals.find(
      (g) => g.year === year && g.mediaType === mediaType
    )

    // Build the full goal object (needed for both state update and API call)
    const goal: ConsumptionGoal = existing
      ? { ...existing, target }
      : { id: `cg-${year}-${mediaType}`, year, mediaType, target }

    // 1. Update local state immediately so the UI reflects the change at once
    setGoals((prev) =>
      existing
        ? prev.map((g) => (g.id === goal.id ? goal : g))
        : [...prev, goal]
    )

    // 2. Persist in the background — fire and forget
    fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    }).catch((err) => console.error('Failed to save goal:', err))
  }

  return (
    <GoalsContext.Provider value={{ goals, setGoal }}>
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoalsContext(): GoalsContextValue {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoalsContext must be used within GoalsProvider')
  return ctx
}
