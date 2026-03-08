import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ConsumptionGoal, MediaItem, MediaType } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract the year from an ISO date string. e.g. "2026-03-07T00:00:00Z" → 2026 */
export function deriveYear(dateString: string): number {
  return new Date(dateString).getFullYear()
}

/**
 * Fuzzy title match — returns true if two titles are similar enough to flag
 * as potential duplicates. Strips common leading articles before comparing.
 * Stub: currently exact-matches after normalisation.
 * Will be replaced with a proper distance algorithm (e.g. Levenshtein) in M3.
 */
export function fuzzyMatch(a: string, b: string): boolean {
  const normalise = (s: string) =>
    s.toLowerCase().replace(/^(the |a |an )/i, '').trim()
  return normalise(a) === normalise(b)
}

/**
 * Compute goal progress for a given year and media type.
 * Pure function — pass items and goals from wherever they live (context, DB, etc.).
 * Returns consumed count, target, and percentage (0–100, capped).
 */
export function getGoalProgress(
  year: number,
  mediaType: MediaType,
  items: MediaItem[],
  goals: ConsumptionGoal[]
): { consumed: number; target: number; percent: number } {
  const goal = goals.find((g) => g.year === year && g.mediaType === mediaType)
  const target = goal?.target ?? 0
  const consumed = items.filter(
    (item) => item.mediaType === mediaType && item.status === 'done' && item.consumedYear === year
  ).length
  const percent = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  return { consumed, target, percent }
}
