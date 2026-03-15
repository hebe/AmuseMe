/**
 * Recommendation generation.
 *
 * Two-step process:
 *  1. Ask Gemini for want-list surfacing + new external suggestions,
 *     calibrated against the user's taste profile and optional mood.
 *  2. Enrich external suggestions server-side (OMDB for movies/TV,
 *     Google Books for books) so the client gets cover images immediately.
 */

import { geminiJson } from './gemini'
import {
  enrichFromGoogleBooks,
  enrichFromOmdb,
} from '@/lib/enrichment'
import type {
  MediaItem,
  MediaType,
  RecommendationSuggestion,
  TasteProfileDetail,
} from '@/lib/types'

// ─── Gemini response types ─────────────────────────────────────────────────────

interface GeminiWantItem {
  wantListItemId: string
  title:          string
  subtitle?:      string
  mediaType:      string
  whyThisForYou:  string
}

interface GeminiExternalItem {
  title:         string
  subtitle?:     string  // author / director / host
  mediaType:     string
  whyThisForYou: string
}

interface RecsGeminiResponse {
  fromWantList: GeminiWantItem[]
  external:     GeminiExternalItem[]
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  detail:    TasteProfileDetail,
  wantItems: MediaItem[],
  allDone:   MediaItem[],
  mood?:     string,
): string {
  const profileText = [
    `Overall patterns: ${detail.overallPatterns}`,
    detail.bookTastes    && `Books: ${detail.bookTastes}`,
    detail.movieTastes   && `Movies: ${detail.movieTastes}`,
    detail.tvTastes      && `TV: ${detail.tvTastes}`,
    detail.podcastTastes && `Podcasts: ${detail.podcastTastes}`,
    `Rating patterns: ${detail.ratingPatterns}`,
    detail.notableQuirks && `Quirks: ${detail.notableQuirks}`,
  ].filter(Boolean).join('\n')

  // Compact want list — include genre + author/director so Gemini can match mood
  const wantList = wantItems.map(i => ({
    id:   i.id,
    t:    i.title,
    type: i.mediaType,
    a:    i.author    || undefined,
    d:    i.director  || undefined,
    g:    i.genres    || undefined,
  }))

  // Already-consumed titles to avoid re-recommending
  const consumed = allDone.map(i => i.title).slice(0, 300).join(', ')

  // Figure out which media types have enough history to recommend for
  const activeMediatypes = [
    allDone.filter(i => i.mediaType === 'book').length      >= 3 ? 'book'      : null,
    allDone.filter(i => i.mediaType === 'movie').length     >= 3 ? 'movie'     : null,
    allDone.filter(i => i.mediaType === 'tv_season').length >= 3 ? 'tv_season' : null,
    allDone.filter(i => i.mediaType === 'podcast').length   >= 3 ? 'podcast'   : null,
  ].filter(Boolean).join(', ')

  return `\
You are a personal media advisor. Generate recommendations grounded in this taste profile.

TASTE PROFILE:
${profileText}

WANT LIST (id, title, type, author/director, genres):
${JSON.stringify(wantList)}

ALREADY CONSUMED (do not suggest these):
${consumed}
${mood ? `\nUSER MOOD/INTENT: "${mood}"\n` : ''}
ACTIVE MEDIA TYPES (enough history): ${activeMediatypes}

Return ONLY a JSON object with:

fromWantList: Array of up to 6 items already on the want list that best fit the taste profile${mood ? ' and the stated mood' : ''}. For each:
  - wantListItemId: exact id from the want list
  - title: exact title from the want list
  - subtitle: author, director, or host if you have it
  - mediaType: the type
  - whyThisForYou: 1–2 sentences grounded in the taste profile and their pattern of what they rate highly

external: Array of 3–4 NEW suggestions per active media type (not on want list, not already consumed). For each:
  - title: exact, commonly known title (this will be used to search OMDB / Google Books)
  - subtitle: author name for books, director for films, host for podcasts
  - mediaType: book | movie | tv_season | podcast
  - whyThisForYou: 1–2 sentences specifically tied to patterns in their taste profile${mood ? ' and their stated mood' : ''}

Prioritise quality over quantity. Be specific about WHY each item fits this person, not generic praise. For books always include the author in subtitle.`
}

// ─── Enrichment pass ──────────────────────────────────────────────────────────

async function enrichExternal(
  item: GeminiExternalItem,
): Promise<RecommendationSuggestion> {
  const base: RecommendationSuggestion = {
    title:         item.title,
    subtitle:      item.subtitle,
    mediaType:     item.mediaType as MediaType,
    whyThisForYou: item.whyThisForYou,
    isFromWantList: false,
  }

  try {
    if (item.mediaType === 'movie') {
      const e = await enrichFromOmdb(item.title, 'movie')
      return { ...base, coverImageUrl: e.coverImageUrl, description: e.description }
    }
    if (item.mediaType === 'tv_season') {
      const e = await enrichFromOmdb(item.title, 'series')
      return { ...base, coverImageUrl: e.coverImageUrl, description: e.description }
    }
    if (item.mediaType === 'book') {
      const e = await enrichFromGoogleBooks(item.title, item.subtitle)
      return { ...base, coverImageUrl: e.coverImageUrl, description: e.description }
    }
  } catch {
    // Enrichment is best-effort — return unenriched on failure
  }

  return base
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateRecommendations(
  detail:    TasteProfileDetail,
  wantItems: MediaItem[],
  allDone:   MediaItem[],
  mood?:     string,
): Promise<RecommendationSuggestion[]> {
  const prompt = buildPrompt(detail, wantItems, allDone, mood)
  const raw    = await geminiJson<RecsGeminiResponse>(prompt)

  // Map want-list items to suggestions (cover comes from existing MediaItem)
  const wantSuggestions: RecommendationSuggestion[] = (raw.fromWantList ?? []).map(item => {
    const existing = wantItems.find(w => w.id === item.wantListItemId)
    return {
      title:          item.title,
      subtitle:       item.subtitle,
      mediaType:      item.mediaType as MediaType,
      whyThisForYou:  item.whyThisForYou,
      coverImageUrl:  existing?.coverImageUrl,
      description:    existing?.description,
      isFromWantList: true,
      wantListItemId: item.wantListItemId,
    }
  })

  // Enrich external suggestions in parallel (best-effort)
  const externalSuggestions = await Promise.all(
    (raw.external ?? []).map(enrichExternal),
  )

  // Want-list items first, then external grouped by media type
  return [
    ...wantSuggestions,
    ...externalSuggestions,
  ]
}
