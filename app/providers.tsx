'use client'

/**
 * Client-side providers wrapper.
 * Kept separate from layout.tsx so that layout can remain a server component
 * (needed to export `metadata`, `viewport`, and to call auth() + DB queries).
 *
 * Receives server-fetched initial data as props and passes it into the
 * respective context providers so they start hydrated with real data.
 */

import { Toaster } from 'sonner'
import { MediaItemsProvider } from '@/contexts/MediaItemsContext'
import { GoalsProvider } from '@/contexts/GoalsContext'
import type { ConsumptionGoal, MediaItem } from '@/lib/types'

interface ProvidersProps {
  children: React.ReactNode
  initialItems: MediaItem[]
  initialGoals: ConsumptionGoal[]
}

export function Providers({ children, initialItems, initialGoals }: ProvidersProps) {
  return (
    <MediaItemsProvider initialItems={initialItems}>
      <GoalsProvider initialGoals={initialGoals}>
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
      </GoalsProvider>
    </MediaItemsProvider>
  )
}
