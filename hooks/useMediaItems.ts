'use client'

import { useState } from 'react'
import { mediaItems as initialItems } from '@/lib/mock-data'
import type { MediaItem } from '@/lib/types'

/**
 * Local state hook for media items.
 * Seeded from mock data — swap the initialiser for a DB fetch in M4+.
 */
export function useMediaItems() {
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

  return { items, addItem, updateItem, getItemById }
}
