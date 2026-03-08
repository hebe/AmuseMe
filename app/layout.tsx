/**
 * Root layout — async server component.
 *
 * Because this is a server component it can call auth() and the DB query
 * helpers directly (no fetch needed). It passes the results down as props
 * to <Providers>, which initialises the client-side contexts. This means
 * every page renders with real data on the very first paint — no loading
 * spinner, no layout shift.
 *
 * When the user is not logged in (e.g. on /login), auth() returns null and
 * we pass empty arrays. The middleware redirects unauthenticated requests
 * away from protected routes before they ever reach this layout.
 */

import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/nav/BottomNav'
import { Providers } from './providers'
import { auth } from '@/auth'
import { getItemsByUser, getGoalsByUser } from '@/lib/db/queries'

const geist = Geist({
  // Use '--font-sans' so Geist slots directly into the variable shadcn's theme reads.
  // globals.css has `--font-sans: var(--font-sans)` in @theme inline, which is
  // self-referential until something actually defines --font-sans on the element.
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AmuseMe',
  description: 'Track what you want to consume — and what you have.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // viewport-fit=cover lets the nav extend behind the iOS home indicator,
  // then we use env(safe-area-inset-bottom) in the nav itself to push content up.
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const userId  = session?.user?.id

  // Fetch in parallel when logged in; fall back to empty arrays on /login
  const [initialItems, initialGoals] = userId
    ? await Promise.all([getItemsByUser(userId), getGoalsByUser(userId)])
    : [[], []]

  return (
    <html lang="no">
      <body className={`${geist.variable} font-sans antialiased`}>
        <Providers initialItems={initialItems} initialGoals={initialGoals}>
          {/* pb-16 keeps content above the fixed bottom nav.
              The extra env() padding ensures content also clears the iOS home indicator. */}
          <div
            className="mx-auto min-h-screen max-w-md pb-16"
            style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
          >
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
