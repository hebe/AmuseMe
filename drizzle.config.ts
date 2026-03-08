/**
 * Drizzle Kit configuration.
 *
 * `drizzle-kit push` reads this file, connects to DATABASE_URL, and
 * creates / alters tables to match lib/db/schema.ts — no migration files
 * needed for a project this young. Run it whenever you change the schema.
 *
 * dotenv loads .env.local explicitly because drizzle-kit is not Next.js
 * and won't pick it up on its own (unlike `npm run dev`).
 *
 * Usage:
 *   npx drizzle-kit push
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import type { Config } from 'drizzle-kit'

export default {
  schema:  './lib/db/schema.ts',
  out:     './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
