'use client'

/**
 * Thin re-export so all existing callers (library, dashboard, etc.) keep
 * the same import path. State now lives in MediaItemsContext so it's shared
 * across the whole app — adding an item in /add is immediately visible in /library.
 */
export { useMediaItemsContext as useMediaItems } from '@/contexts/MediaItemsContext'
