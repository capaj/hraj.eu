import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { deleteOgImageFromR2 } from './utils'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'

const JoinEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  plusAttendees: z
    .array(z.string().min(1, 'Guest name is required').trim())
    .max(2, 'You can bring up to two guests')
    .optional()
})

export const joinEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = JoinEventSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid join payload: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to join an event')
    }

    const [event] = await db
      .select()
      .from(eventT)
      .where(eq(eventT.id, data.eventId))
      .limit(1)

    if (!event) {
      throw new Error('Event not found')
    }

    const allParticipants = await db
      .select()
      .from(participantT)
      .where(eq(participantT.eventId, data.eventId))

    const existingParticipant = allParticipants.find(
      (p) => p.userId === session.user.id
    )

    const requestedPlusAttendees = (data.plusAttendees ??
      existingParticipant?.plusAttendees ??
      [])
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 2)

    const confirmedHeadcount = allParticipants
      .filter((p) => p.status === 'confirmed')
      .reduce((total, participant) => {
        const extras = participant.plusAttendees?.length ?? 0
        return total + 1 + extras
      }, 0)

    const confirmedCount = allParticipants.filter(
      (p) => p.status === 'confirmed'
    ).length
    const waitlistCount = allParticipants.filter(
      (p) => p.status === 'waitlisted'
    ).length

    const existingConfirmedLoad =
      existingParticipant?.status === 'confirmed'
        ? 1 + (existingParticipant.plusAttendees?.length ?? 0)
        : 0

    const availableSpots =
      event.maxParticipants - (confirmedHeadcount - existingConfirmedLoad)

    const requestedHeadcount = 1 + requestedPlusAttendees.length

    if (
      existingParticipant?.status === 'confirmed' &&
      requestedHeadcount > availableSpots
    ) {
      throw new Error('Not enough spots for you and your guests right now.')
    }

    const isSpotAvailable = requestedHeadcount <= availableSpots
    const status = isSpotAvailable ? 'confirmed' : 'waitlisted'
    const ordinal =
      status === 'confirmed'
        ? confirmedCount + 1
        : confirmedCount + waitlistCount + 1

    if (existingParticipant) {
      // Rejoining after cancellation or accepting invite
      await db
        .update(participantT)
        .set({
          status,
          confirmedParticipantOrdinal: ordinal,
          plusAttendees: requestedPlusAttendees
        })
        .where(eq(participantT.id, existingParticipant.id))
    } else {
      // New join
      await db.insert(participantT).values({
        eventId: data.eventId,
        userId: session.user.id,
        status,
        confirmedParticipantOrdinal: ordinal,
        plusAttendees: requestedPlusAttendees
      })
    }

    const participants = await getParticipants(data.eventId)
    
    // Invalidate OG image cache, ignore if it errors
    void deleteOgImageFromR2(data.eventId).catch((e) => {
      console.error('Failed to delete OG image from R2:', e)
    })

    return {
      status,
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

