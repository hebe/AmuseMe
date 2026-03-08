'use client'

/**
 * useGoals — thin hook that composes GoalsContext + MediaItemsContext.
 *
 * The public API is identical to the old mock-data version:
 *   const { goals, setGoal, getProgress } = useGoals()
 *
 * All callers (goals page, dashboard) keep working without any changes.
 *
 * Why a hook instead of consuming the contexts directly?
 * Because getProgress() needs both goals *and* items, and the hook is the
 * clean place to wire those two contexts together using the shared
 * getGoalProgress() utility from lib/utils.ts.
 */

import { useGoalsContext } from '@/contexts/GoalsContext'
import { useMediaItemsContext } from '@/contexts/MediaItemsContext'
import { getGoalProgress } from '@/lib/utils'
import type { MediaType } from '@/lib/types'

export function useGoals() {
  const { goals, setGoal } = useGoalsContext()
  const { items } = useMediaItemsContext()

  function getProgress(year: number, mediaType: MediaType) {
    return getGoalProgress(year, mediaType, items, goals)
  }

  return { goals, setGoal, getProgress }
}
