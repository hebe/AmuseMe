import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/nav/BottomNav'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="no">
      <body className={`${geist.variable} font-sans antialiased`}>
        {/* pb-16 keeps content above the fixed bottom nav.
            The extra env() padding ensures content also clears the iOS home indicator. */}
        <div
          className="mx-auto min-h-screen max-w-md pb-16"
          style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
