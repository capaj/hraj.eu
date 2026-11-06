import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'
import type { db } from '../../drizzle/db'
import { eventT, organizerBlockT, participantT, paymentRequestT, user } from '../../drizzle/schema'
import { normalizeEventGuests } from '../lib/eventGuests'
import { promotePaymentWaitlist } from '../lib/fio/payments'

export async function setOrganizerBlockHandler(
  database: typeof db,
  organizerId: string | undefined,
  input: { userId: string; blocked: boolean },
  now = new Date()
) {
  if (!organizerId) throw new Error('You must be signed in to manage blocked players')
  if (organizerId === input.userId) throw new Error('You cannot block yourself')

  return database.transaction(async (tx) => {
    const [target] = await tx.select({ id: user.id }).from(user)
      .where(eq(user.id, input.userId)).limit(1)
    if (!target) throw new Error('User not found')
    const pair = and(
      eq(organizerBlockT.organizerId, organizerId),
      eq(organizerBlockT.userId, input.userId)
    )
    if (!input.blocked) {
      await tx.delete(organizerBlockT).where(pair)
      return { affectedEventIds: [] as string[] }
    }
    await tx.insert(organizerBlockT).values({ organizerId, userId: input.userId })
      .onConflictDoNothing()

    const localNow = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(now)
    const upcomingEvents = await tx.select().from(eventT).where(and(
      eq(eventT.organizerId, organizerId),
      inArray(eventT.status, ['open', 'confirmed']),
      sql`${eventT.date} || ' ' || ${eventT.startTime} >= ${localNow}`
    ))
    const affectedEventIds: string[] = []
    for (const event of upcomingEvents) {
      const participants = await tx.select().from(participantT).where(and(
        eq(participantT.eventId, event.id),
        inArray(participantT.status, ['confirmed', 'pending_payment', 'waitlisted', 'invited'])
      ))
      let changed = false
      for (const participant of participants) {
        const guests = normalizeEventGuests(participant.plusAttendees)
        if (participant.userId === input.userId) {
          // Cancel the whole booking, retaining payment records for the organizer.
          await tx.update(participantT).set({ status: 'cancelled', plusAttendees: [] })
            .where(eq(participantT.id, participant.id))
          await tx.update(paymentRequestT).set({ cancelledAt: now }).where(and(
            eq(paymentRequestT.participantId, participant.id),
            isNull(paymentRequestT.cancelledAt)
          ))
          changed = true
        } else if (guests.some((guest) => guest.userId === input.userId)) {
          // A blocked account cannot remain in another player's linked guest slot.
          const requests = await tx.select().from(paymentRequestT).where(and(
            eq(paymentRequestT.participantId, participant.id),
            isNull(paymentRequestT.cancelledAt)
          )).orderBy(asc(paymentRequestT.slot))
          for (const request of requests) {
            if (request.slot === 0) continue
            if (guests[request.slot - 1]?.userId === input.userId) {
              await tx.update(paymentRequestT).set({ cancelledAt: now })
                .where(eq(paymentRequestT.id, request.id))
            } else {
              const removedBefore = guests.slice(0, request.slot - 1)
                .filter((guest) => guest.userId === input.userId).length
              if (removedBefore) await tx.update(paymentRequestT)
                .set({ slot: request.slot - removedBefore })
                .where(eq(paymentRequestT.id, request.id))
            }
          }
          await tx.update(participantT).set({
            plusAttendees: guests.filter((guest) => guest.userId !== input.userId)
          }).where(eq(participantT.id, participant.id))
          changed = true
        }
      }
      if (changed) {
        await promotePaymentWaitlist(tx, event)
        await tx.update(eventT).set({ updatedAt: now }).where(eq(eventT.id, event.id))
        affectedEventIds.push(event.id)
      }
    }
    return { affectedEventIds }
  })
}
