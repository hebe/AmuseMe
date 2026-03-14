'use client'

/**
 * MediaItemsContext — shared client-side state for all media items.
 *
 * Initialised with server-fetched items passed in from layout.tsx via Providers,
 * so there is no loading flash: the page renders with real data on first paint.
 *
 * Mutations use optimistic updates:
 *   1. Update local state immediately (instant UI feedback)
 *   2. Persist to the DB via API route in the background
 *
 * If a background call fails we log the error and leave the state as-is.
 * For a personal single-user app this is an acceptable trade-off; the worst
 * case is a change that appears locally but is lost on hard refresh.
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { MediaItem } from '@/lib/types'

type MediaItemsContextValue = {
  items: MediaItem[]
  addItem: (item: MediaItem) => void
  updateItem: (id: string, patch: Partial<MediaItem>) => void
  deleteItem: (id: string) => void
  getItemById: (id: string) => MediaItem | undefined
}

const MediaItemsContext = createContext<MediaItemsContextValue | null>(null)

export function MediaItemsProvider({
  children,
  initialItems,
}: {
  children: ReactNode
  initialItems: MediaItem[]
}) {
  const [items, setItems] = useState<MediaItem[]>(initialItems)

  function addItem(item: MediaItem): void {
    // 1. Optimistic update
    setItems((prev) => [item, ...prev])

    // 2. Persist in the background
    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((err) => console.error('Failed to save item:', err))
  }

  function updateItem(id: string, patch: Partial<MediaItem>): void {
    // 1. Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    )

    // 2. Persist in the background
    fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch((err) => console.error('Failed to update item:', err))
  }

  function deleteItem(id: string): void {
    // 1. Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id))

    // 2. Persist in the background
    fetch(`/api/items/${id}`, { method: 'DELETE' })
      .catch((err) => console.error('Failed to delete item:', err))
  }

  function getItemById(id: string): MediaItem | undefined {
    return items.find((item) => item.id === id)
  }

  return (
    <MediaItemsContext.Provider value={{ items, addItem, updateItem, deleteItem, getItemById }}>
      {children}
    </MediaItemsContext.Provider>
  )
}

export function useMediaItemsContext(): MediaItemsContextValue {
  const ctx = useContext(MediaItemsContext)
  if (!ctx) throw new Error('useMediaItemsContext must be used within MediaItemsProvider')
  return ctx
}
