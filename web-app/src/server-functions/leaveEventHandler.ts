import { asc, eq, inArray } from 'drizzle-orm'
import { eventT, participantT } from '../../drizzle/schema'
import { normalizeEventGuests } from '../lib/eventGuests'
import { getWaitlistParticipantIdsToPromote } from './waitlistPromotion'

const ACTIVE_PARTICIPANT_STATUSES = new Set(['confirmed', 'waitlisted'])

export async function leaveEventHandler(
  database: any,
  input: { eventId: string; userId: string }
): Promise<{ convertedGuestUserIds: string[] }> {
  return database.transaction(async (tx: any) => {
    const [event] = await tx
      .select({
        maxParticipants: eventT.maxParticipants,
        reservedParticipants: eventT.reservedParticipants
      })
      .from(eventT)
      .where(eq(eventT.id, input.eventId))
      .limit(1)

    if (!event) {
      throw new Error('Event not found')
    }

    const participantsBeforeLeave = await tx
      .select({
        id: participantT.id,
        userId: participantT.userId,
        status: participantT.status,
        confirmedParticipantOrdinal: participantT.confirmedParticipantOrdinal,
        plusAttendees: participantT.plusAttendees
      })
      .from(participantT)
      .where(eq(participantT.eventId, input.eventId))
      .orderBy(asc(participantT.createdAt))

    const departingParticipant = participantsBeforeLeave.find(
      (participant: (typeof participantsBeforeLeave)[number]) =>
        participant.userId === input.userId &&
        ACTIVE_PARTICIPANT_STATUSES.has(participant.status)
    )

    if (!departingParticipant) {
      throw new Error('Attendee not found')
    }

    const referencedGuestUserIds =
      departingParticipant.status === 'confirmed'
        ? Array.from(
            new Set(
              normalizeEventGuests(departingParticipant.plusAttendees).flatMap(
                (guest) => (guest.userId ? [guest.userId] : [])
              )
            )
          ).filter((userId) => userId !== input.userId)
        : []

    // Clearing the guest list is part of the same write as leaving: free-form
    // guests leave with their owner, while referenced guests are converted below.
    await tx
      .update(participantT)
      .set({ status: 'cancelled', plusAttendees: [] })
      .where(eq(participantT.id, departingParticipant.id))

    let nextConfirmedOrdinal =
      participantsBeforeLeave.reduce(
        (
          highest: number,
          participant: (typeof participantsBeforeLeave)[number]
        ) => Math.max(highest, participant.confirmedParticipantOrdinal),
        0
      ) + 1
    const convertedGuestUserIds: string[] = []

    for (const guestUserId of referencedGuestUserIds) {
      const existingParticipant = participantsBeforeLeave.find(
        (participant: (typeof participantsBeforeLeave)[number]) =>
          participant.userId === guestUserId
      )

      if (existingParticipant?.status === 'confirmed') {
        continue
      }

      if (existingParticipant) {
        await tx
          .update(participantT)
          .set({
            status: 'confirmed',
            plusAttendees: [],
            confirmedParticipantOrdinal: nextConfirmedOrdinal,
            createdAt: new Date()
          })
          .where(eq(participantT.id, existingParticipant.id))
      } else {
        await tx.insert(participantT).values({
          eventId: input.eventId,
          userId: guestUserId,
          status: 'confirmed',
          confirmedParticipantOrdinal: nextConfirmedOrdinal,
          plusAttendees: []
        })
      }

      nextConfirmedOrdinal += 1
      convertedGuestUserIds.push(guestUserId)
    }

    // Re-read inside this transaction so referenced guests consume their spots
    // before any FIFO waitlist promotion is calculated.
    const participantsAfterConversion = await tx
      .select({
        id: participantT.id,
        status: participantT.status,
        plusAttendees: participantT.plusAttendees
      })
      .from(participantT)
      .where(eq(participantT.eventId, input.eventId))
      .orderBy(asc(participantT.createdAt))

    const participantIdsToPromote = getWaitlistParticipantIdsToPromote(
      participantsAfterConversion,
      event.maxParticipants,
      event.reservedParticipants ?? 0
    )

    if (participantIdsToPromote.length) {
      await tx
        .update(participantT)
        .set({ status: 'confirmed' })
        .where(inArray(participantT.id, participantIdsToPromote))
    }

    return { convertedGuestUserIds }
  })
}
