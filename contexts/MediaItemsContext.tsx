'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { mediaItems as initialItems } from '@/lib/mock-data'
import type { MediaItem } from '@/lib/types'

type MediaItemsContextValue = {
  items: MediaItem[]
  addItem: (item: MediaItem) => void
  updateItem: (id: string, patch: Partial<MediaItem>) => void
  getItemById: (id: string) => MediaItem | undefined
}

const MediaItemsContext = createContext<MediaItemsContextValue | null>(null)

export function MediaItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MediaItem[]>(initialItems)

  function addItem(item: MediaItem): void {
    setItems((prev) => [item, ...prev])
  }

  function updateItem(id: string, patch: Partial<MediaItem>): void {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    )
  }

  function getItemById(id: string): MediaItem | undefined {
    return items.find((item) => item.id === id)
  }

  return (
    <MediaItemsContext.Provider value={{ items, addItem, updateItem, getItemById }}>
      {children}
    </MediaItemsContext.Provider>
  )
}

export function useMediaItemsContext(): MediaItemsContextValue {
  const ctx = useContext(MediaItemsContext)
  if (!ctx) throw new Error('useMediaItemsContext must be used within MediaItemsProvider')
  return ctx
}
