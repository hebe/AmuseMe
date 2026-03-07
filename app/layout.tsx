import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/nav/BottomNav'

const geist = Geist({
  variable: '--font-geist-sans',
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="no">
      <body className={`${geist.variable} font-sans antialiased`}>
        {/* pb-16 keeps content above the fixed bottom nav */}
        <div className="mx-auto min-h-screen max-w-md pb-16">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
