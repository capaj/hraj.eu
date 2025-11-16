import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
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

    const existingParticipant = await db
      .select()
      .from(participantT)
      .where(
        and(
          eq(participantT.eventId, data.eventId),
          eq(participantT.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingParticipant.length > 0) {
      return {
        status: existingParticipant[0].status,
        participants: await getParticipants(data.eventId)
      }
    }

    const allParticipants = await db
      .select()
      .from(participantT)
      .where(eq(participantT.eventId, data.eventId))

    const confirmedCount = allParticipants.filter(
      (p) => p.status === 'confirmed'
    ).length
    const waitlistCount = allParticipants.filter(
      (p) => p.status === 'waitlisted'
    ).length

    const isSpotAvailable = confirmedCount < event.maxParticipants
    const status = isSpotAvailable ? 'confirmed' : 'waitlisted'

    await db.insert(participantT).values({
      eventId: data.eventId,
      userId: session.user.id,
      status,
      confirmedParticipantOrdinal:
        status === 'confirmed'
          ? confirmedCount + 1
          : confirmedCount + waitlistCount + 1
    })

    const participants = await getParticipants(data.eventId)

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

