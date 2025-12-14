import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'

const LeaveEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required')
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

    await db
      .update(participantT)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(participantT.eventId, data.eventId),
          eq(participantT.userId, session.user.id)
        )
      )

    const participants = await getParticipants(data.eventId)

    return {
      status: 'left',
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
