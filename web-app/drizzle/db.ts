import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'
import { env } from 'cloudflare:workers'

const fetchCompat: typeof fetch = async (input, init) => {
  if (typeof input === 'string' || input instanceof URL) {
    return fetch(input, init)
  }

  if (input && typeof input === 'object' && 'url' in input) {
    const request = input as Request

    return fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ?? undefined,
      signal: request.signal ?? undefined
    })
  }

  return fetch(input as Request, init)
}

const turso = createClient({
  url: env.TURSO_DATABASE_URL!,
  authToken: env.TURSO_AUTH_TOKEN!,
  fetch: fetchCompat // why is this necessary???? TODO figure out
})

export const db = drizzle(turso, { schema })
