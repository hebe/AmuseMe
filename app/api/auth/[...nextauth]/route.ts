/**
 * NextAuth route handler.
 * The [...nextauth] catch-all handles all Auth.js endpoints:
 *   GET  /api/auth/session
 *   POST /api/auth/callback/credentials
 *   GET  /api/auth/signout
 *   … etc.
 */

import { handlers } from '@/auth'

export const { GET, POST } = handlers
