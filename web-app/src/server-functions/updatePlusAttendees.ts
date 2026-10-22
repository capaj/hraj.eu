import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { deleteOgImageFromR2 } from './utils'
import { getEventGuestNames, normalizeEventGuests } from '~/lib/eventGuests'
import { joinEventHandler } from './joinEventHandler'

const EventGuestSchema = z.union([
  z.string().min(1, 'Guest name is required').trim(),
  z.object({
    name: z.string().min(1, 'Guest name is required').trim(),
    userId: z.string().min(1).optional()
  })
])

const UpdatePlusAttendeesSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  plusAttendees: z.array(EventGuestSchema)
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

    const status = await joinEventHandler(db, {
      eventId: data.eventId, userId: session.user.id,
      plusAttendees: data.plusAttendees, updatingGuests: true
    })

    const updatedParticipants = await getParticipants(data.eventId)

    void deleteOgImageFromR2(data.eventId).catch((e) => {
      console.error('Failed to delete OG image from R2:', e)
    })

    return {
      status,
      participants: updatedParticipants
    }
  })

async function getParticipants(eventId: string) {
  const participants = await db
    .select({
      userId: participantT.userId,
      status: participantT.status,
      plusAttendees: participantT.plusAttendees,
      createdAt: participantT.createdAt
    })
    .from(participantT)
    .where(eq(participantT.eventId, eventId))

  const participantPlusOnes = participants.reduce(
    (acc, participant) => {
      acc[participant.userId] = getEventGuestNames(participant.plusAttendees)
      return acc
    },
    {} as Record<string, string[]>
  )

  const participantGuests = participants.reduce(
    (acc, participant) => {
      acc[participant.userId] = normalizeEventGuests(participant.plusAttendees)
      return acc
    },
    {} as Record<string, ReturnType<typeof normalizeEventGuests>>
  )

  return {
    pendingPayment: participants.filter((p) => p.status === 'pending_payment').map((p) => p.userId),
    confirmed: participants
      .filter((p) => p.status === 'confirmed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => p.userId),
    waitlisted: participants
      .filter((p) => p.status === 'waitlisted')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => p.userId),
    plusAttendees: participantPlusOnes,
    guests: participantGuests,
    participantJoinedAt: participants
      .filter((p) => p.status === 'confirmed')
      .reduce(
        (acc, participant) => {
          acc[participant.userId] = new Date(participant.createdAt)
          return acc
        },
        {} as Record<string, Date>
      ),
    waitlistJoinedAt: participants
      .filter((p) => p.status === 'waitlisted')
      .reduce(
        (acc, participant) => {
          acc[participant.userId] = new Date(participant.createdAt)
          return acc
        },
        {} as Record<string, Date>
      )
  }
}
