import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'
import {
  eventT,
  fioConnectionT,
  fioReceiptT,
  participantT,
  paymentRequestT,
  user
} from '../../../drizzle/schema'
import type { db } from '../../../drizzle/db'
import { normalizeEventGuests } from '../eventGuests'
import { getWaitlistParticipantIdsToPromote } from '../../server-functions/waitlistPromotion'
import {
  attendanceAfterPayment,
  fixedPriceCents,
  matchesPayment,
  paymentVariableSymbol
} from './paymentPolicy'
import type { FioStatement } from './api'

export type PaymentDatabase = Pick<typeof db, 'select' | 'insert' | 'update'>

export async function resolveEventPayment(
  database: PaymentDatabase,
  organizerId: string,
  input: {
    paymentMode?: 'manual' | 'fio'
    requirePayment?: boolean
    price?: number | null
    currency: string
    idealParticipants?: number | null
    maxParticipants: number
  }
) {
  const paymentMode = input.paymentMode ?? 'manual'
  // Fio verification always gates attendance; manual tracking can be optional
  // or require the player's own payment declaration.
  const requirePayment =
    paymentMode === 'fio' || (input.requirePayment ?? false)
  const pricePerPersonCents =
    paymentMode === 'fio' || requirePayment
      ? fixedPriceCents(
          input.price,
          input.idealParticipants || input.maxParticipants
        )
      : null
  if (paymentMode === 'manual')
    return {
      paymentMode,
      requirePayment,
      pricePerPersonCents,
      fioConnectionId: null
    }
  const [connection] = await database
    .select()
    .from(fioConnectionT)
    .where(eq(fioConnectionT.userId, organizerId))
  if (!connection?.encryptedToken)
    throw new Error('Connect your Fio account in your profile first')
  if (input.currency !== connection.currency)
    throw new Error('Fio payments require CZK')
  return {
    paymentMode,
    requirePayment,
    pricePerPersonCents,
    fioConnectionId: connection.userId
  }
}

export async function ensurePaymentRequests(
  database: PaymentDatabase,
  event: typeof eventT.$inferSelect,
  participant: typeof participantT.$inferSelect
) {
  if (
    event.paymentMode !== 'fio' ||
    !['confirmed', 'pending_payment'].includes(participant.status)
  )
    return
  if (!event.fioConnectionId || !event.pricePerPersonCents)
    throw new Error('Event payment configuration is missing')
  const [player] = await database
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, participant.userId))
  const names = [
    player?.name || participant.userId,
    ...normalizeEventGuests(participant.plusAttendees).map(
      (guest) => guest.name
    )
  ]
  for (const [slot, playerName] of names.entries()) {
    const inserted = await database
      .insert(paymentRequestT)
      .values({
        participantId: participant.id,
        connectionId: event.fioConnectionId,
        slot,
        playerName,
        amountCents: event.pricePerPersonCents,
        currency: event.currency
      })
      .onConflictDoNothing()
      .returning({ id: paymentRequestT.id })
    if (inserted[0]) paymentVariableSymbol(inserted[0].id)
  }
}

// Caller holds a write transaction, shared by joins, leaves and capacity edits.
export async function promotePaymentWaitlist(
  database: PaymentDatabase,
  event: typeof eventT.$inferSelect
) {
  if (!['open', 'confirmed'].includes(event.status)) return 0
  const participants = await database
    .select()
    .from(participantT)
    .where(eq(participantT.eventId, event.id))
    .orderBy(asc(participantT.createdAt), asc(participantT.id))
  const ids = getWaitlistParticipantIdsToPromote(
    participants,
    event.maxParticipants,
    event.reservedParticipants
  )
  for (const id of ids) {
    const [participant] = await database
      .update(participantT)
      .set({ status: event.requirePayment ? 'pending_payment' : 'confirmed' })
      .where(eq(participantT.id, id))
      .returning()
    await ensurePaymentRequests(database, event, participant)
  }
  return ids.length
}

export async function reconcileFioStatement(
  database: PaymentDatabase,
  connectionId: string,
  statement: FioStatement,
  now = new Date()
) {
  const requests = await database
    .select()
    .from(paymentRequestT)
    .where(eq(paymentRequestT.connectionId, connectionId))
  const bySymbol = new Map(
    requests.map((request) => [paymentVariableSymbol(request.id), request])
  )
  const touchedParticipants = new Set<number>()
  for (const credit of statement.credits) {
    const request = bySymbol.get(credit.variableSymbol)
    if (!request || !matchesPayment(request, credit)) continue
    await database
      .insert(fioReceiptT)
      .values({
        iban: statement.iban,
        transactionId: credit.id,
        paymentRequestId: request.id,
        amountCents: credit.amountCents,
        bookedOn: credit.bookedOn
      })
      .onConflictDoNothing()
    const [total] = await database
      .select({
        cents: sql<number>`coalesce(sum(${fioReceiptT.amountCents}), 0)`
      })
      .from(fioReceiptT)
      .where(eq(fioReceiptT.paymentRequestId, request.id))
    if (Number(total.cents) >= request.amountCents && !request.paidAt) {
      await database
        .update(paymentRequestT)
        .set({ paidAt: now })
        .where(
          and(
            eq(paymentRequestT.id, request.id),
            isNull(paymentRequestT.paidAt)
          )
        )
    }
    if (!request.cancelledAt) touchedParticipants.add(request.participantId)
  }
  for (const participantId of touchedParticipants) {
    const [row] = await database
      .select({ participant: participantT, event: eventT })
      .from(participantT)
      .innerJoin(eventT, eq(eventT.id, participantT.eventId))
      .where(eq(participantT.id, participantId))
    if (
      !row ||
      !['confirmed', 'pending_payment'].includes(row.participant.status)
    )
      continue
    const active = await database
      .select()
      .from(paymentRequestT)
      .where(
        and(
          eq(paymentRequestT.participantId, participantId),
          isNull(paymentRequestT.cancelledAt)
        )
      )
    const paid =
      active.length === 1 + row.participant.plusAttendees.length &&
      active.every((request) => request.paidAt)
    if (!paid) continue
    const status = attendanceAfterPayment(
      row.participant.status,
      row.event.status,
      paid
    )
    await database
      .update(participantT)
      .set({
        markedAsPaidAt: row.participant.markedAsPaidAt ?? now,
        ...(status ? { status } : {})
      })
      .where(
        and(
          eq(participantT.id, participantId),
          inArray(participantT.status, ['confirmed', 'pending_payment'])
        )
      )
    if (status)
      await database
        .update(eventT)
        .set({ updatedAt: now })
        .where(eq(eventT.id, row.event.id))
  }
}

export async function prepareEventPaymentUpdate(
  database: PaymentDatabase,
  event: typeof eventT.$inferSelect,
  updates: Partial<typeof eventT.$inferSelect>
) {
  const next = { ...event, ...updates }
  const fixed =
    event.paymentMode === 'fio' ||
    event.requirePayment ||
    next.paymentMode === 'fio' ||
    next.requirePayment
  const [booking] = await database
    .select({ id: participantT.id })
    .from(participantT)
    .where(eq(participantT.eventId, event.id))
    .limit(1)
  const paymentChanged =
    event.paymentMode !== next.paymentMode ||
    event.requirePayment !== next.requirePayment ||
    event.price !== next.price ||
    event.currency !== next.currency
  if (fixed && booking && paymentChanged)
    throw new Error('Payment settings are locked after the first registration')
  const divisorChanged =
    event.idealParticipants !== next.idealParticipants ||
    event.maxParticipants !== next.maxParticipants
  if (paymentChanged || (!booking && fixed && divisorChanged))
    return resolveEventPayment(database, event.organizerId, next)
  return {}
}
