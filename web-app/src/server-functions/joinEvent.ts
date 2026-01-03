import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { deleteOgImageFromR2 } from './utils'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'

const JoinEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required')
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

    if (
      existingParticipant &&
      (existingParticipant.status === 'confirmed' ||
        existingParticipant.status === 'waitlisted')
    ) {
      return {
        status: existingParticipant.status,
        participants: await getParticipants(data.eventId)
      }
    }

    const confirmedCount = allParticipants.filter(
      (p) => p.status === 'confirmed'
    ).length
    const waitlistCount = allParticipants.filter(
      (p) => p.status === 'waitlisted'
    ).length

    const isSpotAvailable = confirmedCount < event.maxParticipants
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
          confirmedParticipantOrdinal: ordinal
        })
        .where(eq(participantT.id, existingParticipant.id))
    } else {
      // New join
      await db.insert(participantT).values({
        eventId: data.eventId,
        userId: session.user.id,
        status,
        confirmedParticipantOrdinal: ordinal
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
      status: participantT.status
    })
    .from(participantT)
    .where(eq(participantT.eventId, eventId))

  return {
    confirmed: participants
      .filter((p) => p.status === 'confirmed')
      .map((p) => p.userId),
    waitlisted: participants
      .filter((p) => p.status === 'waitlisted')
      .map((p) => p.userId)
  }
}

