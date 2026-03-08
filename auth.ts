/**
 * NextAuth v5 (Auth.js) configuration.
 *
 * We use a simple Credentials provider — the user enters a username and
 * password, we look them up in the `users` table, and bcrypt-compare the
 * password against the stored hash. No OAuth, no magic links (which are
 * unreliable on iOS PWA home-screen installs).
 *
 * Exports:
 *   handlers — GET/POST route handlers for /api/auth/[...nextauth]
 *   auth      — server-side session getter (use in Server Components / API routes)
 *   signIn    — programmatic sign-in (used by the login page action)
 *   signOut   — programmatic sign-out
 *
 * The Session type is augmented below to include `user.id` so we can look
 * up the right rows in every DB query.
 */

import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/db/queries'

// Augment the built-in Session type so session.user.id is typed everywhere.
declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null

        const user = await getUserByUsername(credentials.username as string)
        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        // Return value becomes the JWT `user` object
        return { id: user.id, name: user.username }
      },
    }),
  ],

  callbacks: {
    // Persist user.id into the JWT so it survives across requests
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    // Expose user.id on the session object returned by auth()
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },

  pages: {
    signIn: '/login',
  },
})
