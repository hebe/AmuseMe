/**
 * Database connection.
 *
 * We use Neon's HTTP driver (@neondatabase/serverless) instead of a
 * traditional TCP connection. In a serverless environment (Vercel, edge
 * functions) each request spins up a new Node process, so a persistent
 * TCP connection would time out constantly. The HTTP driver sends every
 * query as a plain HTTPS request — no connection management needed.
 *
 * drizzle-orm/neon-http wraps that driver and gives us the Drizzle query
 * builder on top.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })
