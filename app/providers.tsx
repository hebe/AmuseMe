'use client'

/**
 * Client-side providers wrapper.
 * Kept separate from layout.tsx so that layout can remain a server component
 * (needed to export `metadata` and `viewport`).
 */
import { Toaster } from 'sonner'
import { MediaItemsProvider } from '@/contexts/MediaItemsContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MediaItemsProvider>
      {children}
      <Toaster
        position="bottom-center"
        // Nudge the toast above the bottom nav (4rem) + iOS safe area
        style={{ '--offset': 'calc(4.5rem + env(safe-area-inset-bottom))' } as React.CSSProperties}
        toastOptions={{
          style: {
            background: 'oklch(0.990 0.006 258)',
            color: 'oklch(0.22 0.065 258)',
            border: '1px solid oklch(0.908 0.014 258)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
    </MediaItemsProvider>
  )
}
