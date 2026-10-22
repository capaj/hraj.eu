import { and, eq, isNotNull, lte } from 'drizzle-orm'
import { fioConnectionT } from '../../../drizzle/schema'
import type { db } from '../../../drizzle/db'
import { decryptFioToken } from './crypto'
import { fetchFioStatement, FioError, pragueDate } from './api'
import { reconcileFioStatement } from './payments'

const DAY = 86_400_000

export async function syncFioConnection(
  database: typeof db,
  userId: string,
  secret: string,
  now = new Date(),
  fetcher: typeof fetch = fetch
) {
  // Atomic lease shared by cron and the organizer's refresh button. It also
  // enforces Fio's per-token rate limit across worker instances.
  const [connection] = await database
    .update(fioConnectionT)
    .set({ nextSyncAt: new Date(now.getTime() + 120_000) })
    .where(
      and(
        eq(fioConnectionT.userId, userId),
        isNotNull(fioConnectionT.encryptedToken),
        lte(fioConnectionT.nextSyncAt, now)
      )
    )
    .returning()
  if (!connection) return
  try {
    const token = await decryptFioToken(
      connection.encryptedToken!,
      secret,
      userId
    )
    const cursor = connection.lastSyncedAt ?? connection.createdAt
    const from = new Date(
      Math.max(cursor.getTime() - 2 * DAY, now.getTime() - 89 * DAY)
    )
    const to = new Date(Math.min(from.getTime() + 7 * DAY, now.getTime()))
    const statement = await fetchFioStatement(
      token,
      pragueDate(from),
      pragueDate(to),
      fetcher
    )
    if (
      statement.iban !== connection.iban ||
      statement.currency !== connection.currency
    )
      throw new FioError('account_changed')
    await database.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(fioConnectionT)
        .where(eq(fioConnectionT.userId, userId))
      if (current?.encryptedToken !== connection.encryptedToken) return
      await reconcileFioStatement(tx, userId, statement, now)
      await tx
        .update(fioConnectionT)
        .set({
          lastSyncedAt: to,
          syncError:
            cursor.getTime() < now.getTime() - 89 * DAY ||
            connection.syncError === 'history_gap'
              ? 'history_gap'
              : null
        })
        .where(eq(fioConnectionT.userId, userId))
    })
  } catch (error) {
    // Persist only a safe code: never log API responses, URLs or token errors.
    await database
      .update(fioConnectionT)
      .set({
        syncError: error instanceof FioError ? error.code : 'sync_failed'
      })
      .where(
        and(
          eq(fioConnectionT.userId, userId),
          eq(fioConnectionT.encryptedToken, connection.encryptedToken!)
        )
      )
  }
}

export async function syncFioPayments(database: typeof db, secret: string) {
  const connections = await database
    .select({ userId: fioConnectionT.userId })
    .from(fioConnectionT)
    .where(
      and(
        isNotNull(fioConnectionT.encryptedToken),
        lte(fioConnectionT.nextSyncAt, new Date())
      )
    )
  // Keep each invocation below Cloudflare's concurrent outbound request limit.
  for (let index = 0; index < connections.length; index += 4) {
    const results = await Promise.allSettled(
      connections
        .slice(index, index + 4)
        .map((connection) =>
          syncFioConnection(database, connection.userId, secret)
        )
    )
    if (results.some((result) => result.status === 'rejected'))
      console.error('A Fio payment check could not be saved')
  }
}
