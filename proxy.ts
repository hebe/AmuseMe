/**
 * Route protection proxy (Next.js 16 — replaces middleware.ts).
 *
 * Auth.js v5 lets us wrap the proxy with `auth()` so every matched
 * request has `req.auth` available (the session, or null if logged out).
 *
 * Rules:
 *   - Not logged in + not on /login  → redirect to /login
 *   - Logged in + on /login          → redirect to / (already authed)
 *   - Everything else                → let through
 *
 * The matcher excludes:
 *   - /api/auth/** — the NextAuth endpoints themselves (must stay open)
 *   - _next/static, _next/image — Next.js build assets
 *   - favicon.ico and any file with an extension (images, fonts, etc.)
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (!isLoggedIn && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\..+).*)',
  ],
}
