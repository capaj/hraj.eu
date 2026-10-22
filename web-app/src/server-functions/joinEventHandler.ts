import { eq } from 'drizzle-orm'
import type { db } from '../../drizzle/db'
import { eventT, participantT, user } from '../../drizzle/schema'
import { normalizeEventGuests, type StoredEventGuest } from '../lib/eventGuests'
import { ensurePaymentRequests } from '../lib/fio/payments'
import { occupiesSpot } from '../lib/fio/paymentPolicy'
import { pragueDate } from '../lib/fio/api'
import { validateEventGuests } from './validateEventGuests'

export async function joinEventHandler(
  database: typeof db,
  input: {
    eventId: string
    userId: string
    plusAttendees?: StoredEventGuest[]
    updatingGuests?: boolean
  }
) {
  return database.transaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(eventT)
      .where(eq(eventT.id, input.eventId))
    if (!event) throw new Error('Event not found')
    if (
      !['open', 'confirmed'].includes(event.status) ||
      event.date < pragueDate(new Date())
    )
      throw new Error('This event is no longer accepting players')
    const participants = await tx
      .select()
      .from(participantT)
      .where(eq(participantT.eventId, event.id))
    if (
      participants.some(
        (participant) =>
          participant.userId !== input.userId &&
          ['confirmed', 'pending_payment', 'waitlisted'].includes(
            participant.status
          ) &&
          normalizeEventGuests(participant.plusAttendees).some(
            (guest) => guest.userId === input.userId
          )
      )
    )
      throw new Error("You are already registered as another player's guest")
    const existing = participants.find(
      (participant) => participant.userId === input.userId
    )
    const active =
      !!existing &&
      ['confirmed', 'pending_payment', 'waitlisted'].includes(existing.status)
    if (input.updatingGuests && !active)
      throw new Error('You need to join this event before adding guests')
    const [currentUser] = await tx
      .select({ eventJoinBannedUntil: user.eventJoinBannedUntil })
      .from(user)
      .where(eq(user.id, input.userId))
    if (
      !active &&
      currentUser?.eventJoinBannedUntil &&
      currentUser.eventJoinBannedUntil > new Date()
    )
      throw new Error(
        'Your account is temporarily restricted from joining new games.'
      )
    const guests = await validateEventGuests(
      tx,
      normalizeEventGuests(
        input.plusAttendees ?? (active ? existing?.plusAttendees : []) ?? []
      ).slice(0, 2),
      participants,
      input.userId
    )
    if (
      active &&
      (event.paymentMode === 'fio' || event.requirePayment) &&
      JSON.stringify(guests) !==
        JSON.stringify(normalizeEventGuests(existing!.plusAttendees))
    ) {
      throw new Error(
        'For events with fixed payments, guests must join separately after booking'
      )
    }
    if (active && (event.paymentMode === 'fio' || event.requirePayment))
      return existing!.status
    const occupied = participants
      .filter(
        (participant) =>
          participant.userId !== input.userId &&
          occupiesSpot(participant.status)
      )
      .reduce(
        (sum, participant) => sum + 1 + participant.plusAttendees.length,
        0
      )
    const available =
      event.maxParticipants - event.reservedParticipants - occupied
    if (
      existing &&
      occupiesSpot(existing.status) &&
      1 + guests.length > available
    )
      throw new Error('Not enough spots for you and your guests right now.')
    let status: 'confirmed' | 'pending_payment' | 'waitlisted' = 'waitlisted'
    if (1 + guests.length <= available)
      status = event.requirePayment ? 'pending_payment' : 'confirmed'
    const values = {
      status,
      plusAttendees: guests,
      confirmedParticipantOrdinal: active
        ? existing!.confirmedParticipantOrdinal
        : Math.max(
            0,
            ...participants.map(
              (participant) => participant.confirmedParticipantOrdinal
            )
          ) + 1,
      ...(!active
        ? {
            markedAsPaidAt: null,
            paymentIntentRecordedAt: null,
            createdAt: new Date()
          }
        : {})
    } as const
    const [participant] = existing
      ? await tx
          .update(participantT)
          .set(values)
          .where(eq(participantT.id, existing.id))
          .returning()
      : await tx
          .insert(participantT)
          .values({ eventId: event.id, userId: input.userId, ...values })
          .returning()
    await ensurePaymentRequests(tx, event, participant)
    return status
  })
}
