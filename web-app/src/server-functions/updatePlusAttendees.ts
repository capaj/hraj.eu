import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { deleteOgImageFromR2 } from './utils'

const UpdatePlusAttendeesSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  plusAttendees: z
    .array(z.string().min(1, 'Guest name is required').trim())
    .max(2, 'You can bring up to two guests')
})

export const updatePlusAttendees = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = UpdatePlusAttendeesSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid guest payload: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to update guests')
    }

    const [event] = await db
      .select()
      .from(eventT)
      .where(eq(eventT.id, data.eventId))
      .limit(1)

    if (!event) {
      throw new Error('Event not found')
    }

    const participants = await db
      .select()
      .from(participantT)
      .where(eq(participantT.eventId, data.eventId))

    const participant = participants.find(
      (p) => p.userId === session.user.id && p.status !== 'cancelled'
    )

    if (!participant) {
      throw new Error('You need to join this event before adding guests')
    }

    const sanitizedPlusAttendees = data.plusAttendees
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 2)

    const confirmedHeadcount = participants
      .filter((p) => p.status === 'confirmed')
      .reduce((total, current) => {
        const extras = current.plusAttendees?.length ?? 0
        return total + 1 + extras
      }, 0)

    const currentHeadcount =
      participant.status === 'confirmed'
        ? 1 + (participant.plusAttendees?.length ?? 0)
        : 0

    const availableSpots = event.maxParticipants - (confirmedHeadcount - currentHeadcount)
    const requestedHeadcount =
      participant.status === 'confirmed' ? 1 + sanitizedPlusAttendees.length : 0

    if (participant.status === 'confirmed' && requestedHeadcount > availableSpots) {
      throw new Error('Not enough spots for you and your guests right now.')
    }

    await db
      .update(participantT)
      .set({ plusAttendees: sanitizedPlusAttendees })
      .where(eq(participantT.id, participant.id))

    const updatedParticipants = await getParticipants(data.eventId)

    void deleteOgImageFromR2(data.eventId).catch((e) => {
      console.error('Failed to delete OG image from R2:', e)
    })

    return {
      status: participant.status,
      participants: updatedParticipants
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
