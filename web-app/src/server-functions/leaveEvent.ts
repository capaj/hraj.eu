import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { deleteOgImageFromR2 } from './utils'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, asc, eq } from 'drizzle-orm'

const LeaveEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  targetUserId: z.string().min(1).optional()
})

export const leaveEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = LeaveEventSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error('Invalid leave payload')
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to leave an event')
    }

    const userIdToRemove = data.targetUserId ?? session.user.id
    const isRemovingOther = userIdToRemove !== session.user.id

    if (isRemovingOther) {
      const [eventRow] = await db
        .select({ organizerId: eventT.organizerId })
        .from(eventT)
        .where(eq(eventT.id, data.eventId))
        .limit(1)

      if (!eventRow) {
        throw new Error('Event not found')
      }

      if (eventRow.organizerId !== session.user.id) {
        throw new Error('Only the organizer can remove other attendees')
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(participantT)
        .set({ status: 'cancelled' })
        .where(
          and(
            eq(participantT.eventId, data.eventId),
            eq(participantT.userId, userIdToRemove)
          )
        )

      const [event] = await tx
        .select({ maxParticipants: eventT.maxParticipants })
        .from(eventT)
        .where(eq(eventT.id, data.eventId))
        .limit(1)

      if (!event) {
        return
      }

      const participants = await tx
        .select({
          id: participantT.id,
          status: participantT.status,
          plusAttendees: participantT.plusAttendees
        })
        .from(participantT)
        .where(eq(participantT.eventId, data.eventId))
        .orderBy(asc(participantT.createdAt))

      let confirmedHeadcount = participants
        .filter((participant) => participant.status === 'confirmed')
        .reduce((total, participant) => {
          return total + 1 + (participant.plusAttendees?.length ?? 0)
        }, 0)

      const waitlistedParticipants = participants.filter(
        (participant) => participant.status === 'waitlisted'
      )

      for (const waitlistedParticipant of waitlistedParticipants) {
        const participantHeadcount =
          1 + (waitlistedParticipant.plusAttendees?.length ?? 0)

        if (confirmedHeadcount + participantHeadcount > event.maxParticipants) {
          break
        }

        await tx
          .update(participantT)
          .set({ status: 'confirmed' })
          .where(eq(participantT.id, waitlistedParticipant.id))

        confirmedHeadcount += participantHeadcount
      }
    })

    const participants = await getParticipants(data.eventId)

    // Invalidate OG image cache, ignore if it errors
    void deleteOgImageFromR2(data.eventId).catch((e) => {
      console.error('Failed to delete OG image from R2:', e)
    })

    return {
      status: 'left',
      participants
    }
  })

async function getParticipants(eventId: string) {
  const participants = await db
    .select({
      userId: participantT.userId,
      status: participantT.status,
      plusAttendees: participantT.plusAttendees
    })
    .from(participantT)
    .where(eq(participantT.eventId, eventId))

  const participantPlusOnes = participants.reduce(
    (acc, participant) => {
      acc[participant.userId] = participant.plusAttendees || []
      return acc
    },
    {} as Record<string, string[]>
  )

  return {
    confirmed: participants
      .filter((p) => p.status === 'confirmed')
      .map((p) => p.userId),
    waitlisted: participants
      .filter((p) => p.status === 'waitlisted')
      .map((p) => p.userId),
    plusAttendees: participantPlusOnes
  }
}
