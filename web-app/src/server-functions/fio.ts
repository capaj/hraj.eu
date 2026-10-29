import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import {
  eventT,
  fioConnectionT,
  fioReceiptT,
  participantT,
  paymentRequestT,
  user
} from '../../drizzle/schema'
import { auth } from '../lib/auth'
import { encryptFioToken, fingerprintFioToken } from '../lib/fio/crypto'
import { fetchFioStatement, FioError, pragueDate } from '../lib/fio/api'
import { paymentVariableSymbol } from '../lib/fio/paymentPolicy'
import { syncFioConnection } from '../lib/fio/sync'

async function requireUserId() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session?.user?.id)
    throw new Error('You must be signed in to access this page')
  return session.user.id
}

export const getFioConnection = createServerFn({ method: 'GET' }).handler(
  async () => {
    const userId = await requireUserId()
    const [connection] = await db
      .select({
        accountNumber: fioConnectionT.accountNumber,
        iban: fioConnectionT.iban,
        currency: fioConnectionT.currency,
        lastSyncedAt: fioConnectionT.lastSyncedAt,
        syncError: fioConnectionT.syncError,
        connected:
          sql<boolean>`${fioConnectionT.encryptedToken} is not null`.mapWith(
            Boolean
          )
      })
      .from(fioConnectionT)
      .where(eq(fioConnectionT.userId, userId))
    return connection ?? null
  }
)

export const saveFioConnection = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      token: z
        .string()
        .trim()
        .regex(/^[a-zA-Z0-9]{64}$/),
      readOnlyAcknowledged: z.literal(true)
    })
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    try {
      const encryptedToken = await encryptFioToken(
        data.token,
        env.FIO_TOKEN_ENCRYPTION_KEY,
        userId
      )
      const tokenFingerprint = await fingerprintFioToken(data.token)
      const [existingToken] = await db
        .select({ userId: fioConnectionT.userId })
        .from(fioConnectionT)
        .where(eq(fioConnectionT.tokenFingerprint, tokenFingerprint))
      if (existingToken && existingToken.userId !== userId)
        return { error: 'token_in_use' }
      const today = pragueDate(new Date())
      const account = await fetchFioStatement(data.token, today, today)
      return await db.transaction(async (tx) => {
        const [previous] = await tx
          .select()
          .from(fioConnectionT)
          .where(eq(fioConnectionT.userId, userId))
        const [event] = await tx
          .select({ id: eventT.id })
          .from(eventT)
          .where(eq(eventT.fioConnectionId, userId))
          .limit(1)
        if (event && previous?.iban !== account.iban)
          return { error: 'account_changed' }
        const values = {
          encryptedToken,
          tokenFingerprint,
          iban: account.iban,
          accountNumber: account.accountNumber,
          currency: account.currency,
          syncError: null,
          nextSyncAt: new Date(Date.now() + 120_000)
        }
        await tx
          .insert(fioConnectionT)
          .values({ userId, ...values })
          .onConflictDoUpdate({ target: fioConnectionT.userId, set: values })
        return { error: null }
      })
    } catch (error) {
      return {
        error: error instanceof FioError ? error.code : 'connection_failed'
      }
    }
  })

export const disconnectFio = createServerFn({ method: 'POST' }).handler(
  async () => {
    const userId = await requireUserId()
    await db
      .update(fioConnectionT)
      .set({
        encryptedToken: null,
        tokenFingerprint: null,
        syncError: 'disconnected'
      })
      .where(eq(fioConnectionT.userId, userId))
    return { success: true }
  }
)

export const refreshFioPayments = createServerFn({ method: 'POST' }).handler(
  async () => {
    const userId = await requireUserId()
    await syncFioConnection(db, userId, env.FIO_TOKEN_ENCRYPTION_KEY)
    return { success: true }
  }
)

export const getEventPayments = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ eventId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const [event] = await db
      .select()
      .from(eventT)
      .where(eq(eventT.id, data.eventId))
    if (!event) throw new Error('Event not found')
    const isOrganizer = event.organizerId === userId
    const participants = await db
      .select({
        id: participantT.id,
        userId: participantT.userId,
        name: user.name,
        status: participantT.status,
        paidAt: participantT.markedAsPaidAt,
        guests: participantT.plusAttendees
      })
      .from(participantT)
      .innerJoin(user, eq(user.id, participantT.userId))
      .where(
        and(
          eq(participantT.eventId, event.id),
          isOrganizer ? undefined : eq(participantT.userId, userId)
        )
      )
    const [connection] = event.fioConnectionId
      ? await db
          .select({
            accountNumber: fioConnectionT.accountNumber,
            iban: fioConnectionT.iban,
            lastSyncedAt: fioConnectionT.lastSyncedAt,
            syncError: fioConnectionT.syncError,
            connected:
              sql<boolean>`${fioConnectionT.encryptedToken} is not null`.mapWith(
                Boolean
              )
          })
          .from(fioConnectionT)
          .where(eq(fioConnectionT.userId, event.fioConnectionId))
      : []
    const requests =
      event.paymentMode === 'fio'
        ? await db
            .select({
              id: paymentRequestT.id,
              userId: participantT.userId,
              playerName: paymentRequestT.playerName,
              amountCents: paymentRequestT.amountCents,
              currency: paymentRequestT.currency,
              paidAt: paymentRequestT.paidAt,
              cancelledAt: paymentRequestT.cancelledAt,
              participantStatus: participantT.status,
              receivedCents:
                sql<number>`coalesce((select sum(${fioReceiptT.amountCents}) from ${fioReceiptT} where ${fioReceiptT.paymentRequestId} = ${paymentRequestT.id}), 0)`.mapWith(
                  Number
                )
            })
            .from(paymentRequestT)
            .innerJoin(
              participantT,
              eq(participantT.id, paymentRequestT.participantId)
            )
            .where(
              and(
                eq(participantT.eventId, event.id),
                isOrganizer
                  ? undefined
                  : and(
                      eq(participantT.userId, userId),
                      isNull(paymentRequestT.cancelledAt)
                    )
              )
            )
        : []
    return {
      isOrganizer,
      connection:
        isOrganizer || participants.length ? (connection ?? null) : null,
      participants,
      requests: requests.map((request) => ({
        ...request,
        variableSymbol: paymentVariableSymbol(request.id)
      }))
    }
  })
