import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MediaType } from "./types"

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
 * Returns consumed count, target, and percentage (0–100, capped).
 * Stub: returns zeroes — will be wired to the live items array in M3.
 */
export function getGoalProgress(
  _year: number,
  _mediaType: MediaType
): { consumed: number; target: number; pct: number } {
  return { consumed: 0, target: 0, pct: 0 }
}
