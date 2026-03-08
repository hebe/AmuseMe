'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useMediaItems } from '@/hooks/useMediaItems'
import { fuzzyMatch, cn } from '@/lib/utils'
import type { MediaType, MediaStatus, BookFormat, AudiobookSource, StreamingProvider, MediaItem } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable sub-components (scoped to this file)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Segmented pill control — same visual language as the Want/Done tabs in the
 * library. Non-generic so TypeScript doesn't get confused in JSX; callers cast.
 */
function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-xl bg-muted p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Labelled field wrapper — handles the label + optional error message. */
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

/** Shared input / select class — consistent across all text fields. */
const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-3 text-sm ' +
  'placeholder:text-muted-foreground/50 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ' +
  'transition-colors'

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────

type DuplicateMatch = { item: MediaItem; confidence: 'low' | 'high' }

export function AddItemForm({
  editItem,
  onSaveEdit,
}: {
  /** When provided the form runs in edit mode: pre-populated, saves via updateItem. */
  editItem?: MediaItem
  /** Called after a successful save in edit mode (e.g. exit edit mode). */
  onSaveEdit?: () => void
} = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, addItem, updateItem } = useMediaItems()

  // Pre-populate status from ?status=done|want (dashboard quick-action buttons)
  // Ignored in edit mode (editItem.status takes precedence).
  const initialStatus: MediaStatus =
    searchParams.get('status') === 'done' ? 'done' : 'want'

  // ── Form state — seeded from editItem when in edit mode ────────────────────
  const [title, setTitle] = useState(editItem?.title ?? '')
  const [mediaType, setMediaType] = useState<MediaType>(editItem?.mediaType ?? 'book')
  const [status, setStatus] = useState<MediaStatus>(editItem?.status ?? initialStatus)
  const [author, setAuthor] = useState(editItem?.author ?? '')
  const [provider, setProvider] = useState<StreamingProvider | ''>(editItem?.provider ?? '')
  const [sourceText, setSourceText] = useState(editItem?.sourceText ?? '')
  const [sourceUrl, setSourceUrl] = useState(editItem?.sourceUrl ?? '')
  const [movieVenue, setMovieVenue] = useState<'cinema' | 'home' | 'other'>(
    editItem?.movieVenue ?? 'home'
  )
  const [bookFormat, setBookFormat] = useState<BookFormat>(editItem?.bookFormat ?? 'physical')
  const [audiobookSource, setAudiobookSource] = useState<AudiobookSource>(
    editItem?.audiobookSource ?? 'bookbeat'
  )
  const [dateConsumed, setDateConsumed] = useState(() =>
    editItem?.dateConsumed
      ? editItem.dateConsumed.split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Duplicate detection state ──────────────────────────────────────────────
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null)
  // Once the user dismisses a suggestion for the current title, don't nag again
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    // Skip duplicate detection entirely in edit mode (item already exists in the list)
    if (!!editItem || status !== 'done' || !title.trim() || duplicateDismissed) {
      setDuplicate(null)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const titleMatches = items.filter((item) => fuzzyMatch(item.title, title))

      if (!titleMatches.length) {
        setDuplicate(null)
        return
      }

      // High confidence: title AND author both match
      if (author.trim()) {
        const strongMatch = titleMatches.find(
          (item) =>
            item.author?.toLowerCase().trim() === author.toLowerCase().trim()
        )
        if (strongMatch) {
          setDuplicate({ item: strongMatch, confidence: 'high' })
          return
        }
      }

      // Low confidence: title match only
      setDuplicate({ item: titleMatches[0], confidence: 'low' })
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [title, author, status, items, duplicateDismissed])

  // Reset the dismissed flag whenever the user meaningfully edits the title
  const prevTitleRef = useRef(title)
  useEffect(() => {
    if (prevTitleRef.current !== title) {
      setDuplicateDismissed(false)
      prevTitleRef.current = title
    }
  }, [title])

  // ── Validation ─────────────────────────────────────────────────────────────

  function isValidUrl(s: string): boolean {
    try { new URL(s); return true } catch { return false }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (sourceUrl.trim() && !isValidUrl(sourceUrl.trim()))
      errs.sourceUrl = 'Must be a valid URL'
    if (status === 'done' && !dateConsumed)
      errs.dateConsumed = 'Date consumed is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Accept duplicate suggestion ────────────────────────────────────────────

  function handleAcceptDuplicate() {
    if (!duplicate) return
    const consumed = dateConsumed
      ? new Date(dateConsumed).toISOString()
      : new Date().toISOString()
    updateItem(duplicate.item.id, {
      status: 'done',
      dateConsumed: consumed,
      consumedYear: new Date(consumed).getFullYear(),
    })
    toast.success('Logged as consumed')
    router.push('/library')
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const now = new Date().toISOString()
    const consumed =
      status === 'done' && dateConsumed
        ? new Date(dateConsumed).toISOString()
        : undefined

    // ── Edit mode: patch the existing item ───────────────────────────────────
    if (editItem) {
      updateItem(editItem.id, {
        title: title.trim(),
        mediaType,
        status,
        // Explicitly pass undefined to clear fields the user has emptied
        author: author.trim() || undefined,
        provider: provider || undefined,
        sourceText: sourceText.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        bookFormat: mediaType === 'book' ? bookFormat : undefined,
        audiobookSource:
          mediaType === 'book' && bookFormat === 'audiobook' ? audiobookSource : undefined,
        movieVenue:
          mediaType === 'movie' && status === 'done' ? movieVenue : undefined,
        dateConsumed: consumed,
        consumedYear: consumed ? new Date(consumed).getFullYear() : undefined,
      })
      toast.success('Changes saved')
      onSaveEdit?.()
      return
    }

    // ── Add mode: create a new item ───────────────────────────────────────────
    const newItem: MediaItem = {
      id: `item-${Date.now()}`,
      title: title.trim(),
      mediaType,
      status,
      createdAt: now,
      updatedAt: now,
      dateAdded: now,
      ...(author.trim()     && { author: author.trim() }),
      ...(provider          && { provider }),
      ...(sourceText.trim() && { sourceText: sourceText.trim() }),
      ...(sourceUrl.trim()  && { sourceUrl: sourceUrl.trim() }),
      ...(mediaType === 'movie' && status === 'done' && { movieVenue }),
      ...(mediaType === 'book' && { bookFormat }),
      ...(mediaType === 'book' && bookFormat === 'audiobook' && { audiobookSource }),
      ...(consumed && {
        dateConsumed: consumed,
        consumedYear: new Date(consumed).getFullYear(),
      }),
    }

    addItem(newItem)
    toast.success(status === 'done' ? 'Logged as consumed' : 'Added to your want list')
    router.push('/library')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2 pb-6">

      {/* ── Title ── */}
      <Field label="Title" error={errors.title}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Covenant of Water"
          autoFocus
          className={cn(
            inputClass,
            errors.title && 'border-red-400 focus:border-red-400 focus:ring-red-200'
          )}
        />

        {/* Duplicate alert — sits right below the title field */}
        {duplicate && !duplicateDismissed && (
          <div className="rounded-xl border-l-4 border-primary/40 bg-muted/70 py-3 pl-4 pr-3">
            <p className="text-sm leading-snug">
              {duplicate.confidence === 'high' ? 'This looks like' : 'This might be'}{' '}
              <span className="font-semibold">"{duplicate.item.title}"</span>
              {duplicate.item.author && (
                <span className="text-muted-foreground"> by {duplicate.item.author}</span>
              )}
              {' '}— already in your{' '}
              {duplicate.item.status === 'done' ? 'done list' : 'want list'}.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={handleAcceptDuplicate}
                className="flex-1 rounded-lg bg-foreground py-2 text-xs font-medium text-primary-foreground transition-opacity active:opacity-80"
              >
                Yes, mark as consumed
              </button>
              <button
                type="button"
                onClick={() => setDuplicateDismissed(true)}
                className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-medium transition-opacity active:opacity-80"
              >
                No, create new
              </button>
            </div>
          </div>
        )}
      </Field>

      {/* ── Media type ── */}
      <Field label="Type">
        <SegmentedControl
          options={[
            { value: 'book', label: 'Book' },
            { value: 'movie', label: 'Movie' },
            { value: 'tv_season', label: 'TV' },
            { value: 'podcast', label: 'Podcast' },
          ]}
          value={mediaType}
          onChange={(v) => setMediaType(v as MediaType)}
        />
      </Field>

      {/* ── Status ── */}
      <Field label="Status">
        <SegmentedControl
          options={[
            { value: 'want', label: 'Want' },
            { value: 'done', label: 'Done' },
          ]}
          value={status}
          onChange={(v) => setStatus(v as MediaStatus)}
        />
      </Field>

      {/* ── Author — books only ── */}
      {mediaType === 'book' && (
        <Field label="Author">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Abraham Verghese"
            className={inputClass}
          />
        </Field>
      )}

      {/* ── Provider — TV and movies only ── */}
      {(mediaType === 'tv_season' || mediaType === 'movie') && (
        <Field label="Provider">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as StreamingProvider | '')}
            className={cn(inputClass, 'cursor-pointer')}
          >
            <option value="">Not sure / not set</option>
            <option value="apple">Apple TV+</option>
            <option value="disney">Disney+</option>
            <option value="hbo">HBO Max</option>
            <option value="netflix">Netflix</option>
            <option value="nrk">NRK TV</option>
            <option value="paramount">Paramount+</option>
            <option value="prime">Prime Video</option>
            <option value="skyshowtime">SkyShowtime</option>
            <option value="tv2">TV 2 Play</option>
            <option value="viaplay">Viaplay</option>
            <option value="other">Other</option>
          </select>
        </Field>
      )}

      {/* ── Source section ── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Source
        </p>
        <input
          type="text"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Where did you hear about it?"
          className={inputClass}
        />
        <div>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Link (optional)"
            className={cn(
              inputClass,
              errors.sourceUrl && 'border-red-400 focus:border-red-400 focus:ring-red-200'
            )}
          />
          {errors.sourceUrl && (
            <p className="mt-1 text-xs text-red-500">{errors.sourceUrl}</p>
          )}
        </div>
      </div>

      {/* ── Book format — books only ── */}
      {mediaType === 'book' && (
        <Field label="Format">
          <SegmentedControl
            options={[
              { value: 'physical', label: 'Physical' },
              { value: 'ebook', label: 'eBook' },
              { value: 'audiobook', label: 'Audiobook' },
            ]}
            value={bookFormat}
            onChange={(v) => setBookFormat(v as BookFormat)}
          />
        </Field>
      )}

      {/* ── Audiobook service — books + audiobook only ── */}
      {mediaType === 'book' && bookFormat === 'audiobook' && (
        <Field label="Audiobook service">
          <select
            value={audiobookSource}
            onChange={(e) => setAudiobookSource(e.target.value as AudiobookSource)}
            className={cn(inputClass, 'cursor-pointer')}
          >
            <option value="bookbeat">Bookbeat</option>
            <option value="storytel">Storytel</option>
            <option value="podme">PodMe</option>
            <option value="fabel">Fabel</option>
            <option value="other">Other</option>
          </select>
        </Field>
      )}

      {/* ── Venue — movies + done only ── */}
      {mediaType === 'movie' && status === 'done' && (
        <Field label="Watched at">
          <SegmentedControl
            options={[
              { value: 'cinema', label: 'Cinema' },
              { value: 'home', label: 'At home' },
              { value: 'other', label: 'Other' },
            ]}
            value={movieVenue}
            onChange={(v) => setMovieVenue(v as 'cinema' | 'home' | 'other')}
          />
        </Field>
      )}

      {/* ── Date consumed — status = done only ── */}
      {status === 'done' && (
        <Field label="Date consumed" error={errors.dateConsumed}>
          <input
            type="date"
            value={dateConsumed}
            onChange={(e) => setDateConsumed(e.target.value)}
            className={cn(
              inputClass,
              errors.dateConsumed && 'border-red-400 focus:border-red-400 focus:ring-red-200'
            )}
          />
        </Field>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        className="mt-2 w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-primary-foreground transition-opacity active:opacity-80"
      >
        {editItem
          ? 'Save changes'
          : status === 'done' ? 'Log as consumed' : 'Save to want list'}
      </button>

    </form>
  )
}
