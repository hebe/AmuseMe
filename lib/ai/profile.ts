/**
 * Taste-profile generation.
 *
 * Builds a compact representation of the user's consumption history and sends
 * it to Gemini to produce two artefacts:
 *   1. summaryText — 3–5 sentences shown on the recommendations page
 *   2. detailJson  — structured profile used as Gemini context for recommendations
 */

import { geminiJson } from './gemini'
import type { MediaItem, TasteProfileDetail } from '@/lib/types'

// Compact item representation — single-letter keys keep the prompt size down.
interface CompactItem {
  t:  string        // title
  r?: number        // rating 1–6
  g?: string[]      // genres
  y?: number        // consumedYear
  a?: string        // author (books)
  d?: string        // director (movies)
  h?: string        // podcastHost
  n?: string        // notes (first 100 chars)
}

function toCompact(item: MediaItem): CompactItem {
  const c: CompactItem = { t: item.title }
  if (item.rating)           c.r = item.rating
  if (item.genres?.length)   c.g = item.genres
  if (item.consumedYear)     c.y = item.consumedYear
  if (item.author)           c.a = item.author
  if (item.director)         c.d = item.director
  if (item.podcastHost)      c.h = item.podcastHost
  if (item.notes)            c.n = item.notes.slice(0, 100)
  return c
}

interface ProfileGeminiResponse {
  summaryText:     string
  overallPatterns: string
  bookTastes:      string
  movieTastes:     string
  tvTastes:        string
  podcastTastes:   string
  ratingPatterns:  string
  notableQuirks:   string
}

export async function generateTasteProfile(
  items: MediaItem[],
): Promise<{ summaryText: string; detailJson: TasteProfileDetail }> {
  const done = items.filter(i => i.status === 'done')

  const byType = {
    books:    done.filter(i => i.mediaType === 'book').map(toCompact),
    movies:   done.filter(i => i.mediaType === 'movie').map(toCompact),
    tv:       done.filter(i => i.mediaType === 'tv_season').map(toCompact),
    podcasts: done.filter(i => i.mediaType === 'podcast').map(toCompact),
  }

  const prompt = `\
You are analysing a personal media consumption history to create a taste profile.

Consumption history JSON (keys: t=title, r=rating 1-6, g=genres, y=year, a=author, d=director, h=host, n=notes):
${JSON.stringify(byType)}

Stats: ${byType.books.length} books · ${byType.movies.length} movies · ${byType.tv.length} TV seasons · ${byType.podcasts.length} podcasts

Return ONLY a JSON object with these exact string fields:
- summaryText: 3–5 sentences written in second person ("You tend to…") capturing their essential taste and what makes them distinctive as a media consumer. Warm, specific, insightful — suitable for showing directly to the user.
- overallPatterns: Detailed paragraph about cross-media patterns (themes, moods, tone, pacing preferences that appear across types).
- bookTastes: Detailed paragraph about book preferences — genres, authors, narrative styles they rate highly vs just consume.
- movieTastes: Detailed paragraph about film preferences — directors, genres, moods, what earns top marks.
- tvTastes: Detailed paragraph about TV preferences — formats (prestige drama vs procedural vs comedy), themes, shows they binged vs abandoned.
- podcastTastes: Detailed paragraph about podcast preferences — topics, hosts, formats (narrative vs interview vs debate).
- ratingPatterns: Concrete analysis — what specific attributes reliably earn 5–6 ratings vs 1–3? Reference actual titles.
- notableQuirks: Any interesting, surprising, or distinctive patterns. Can be a single short sentence if nothing stands out.

Ground everything in the actual data. Be specific — reference real titles. If a media type has fewer than 5 items, note that and focus on what patterns are visible.`

  const raw = await geminiJson<ProfileGeminiResponse>(prompt)

  return {
    summaryText: raw.summaryText,
    detailJson: {
      overallPatterns: raw.overallPatterns,
      bookTastes:      raw.bookTastes      || undefined,
      movieTastes:     raw.movieTastes     || undefined,
      tvTastes:        raw.tvTastes        || undefined,
      podcastTastes:   raw.podcastTastes   || undefined,
      ratingPatterns:  raw.ratingPatterns,
      notableQuirks:   raw.notableQuirks   || undefined,
    },
  }
}
