import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { participantT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'

const UnmarkParticipantAsPaidSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required')
})

export const unmarkParticipantAsPaid = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = UnmarkParticipantAsPaidSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid payment status payload: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to update payment status')
    }

    const participant = await db.query.participantT.findFirst({
      where: and(
        eq(participantT.eventId, data.eventId),
        eq(participantT.userId, session.user.id)
      )
    })

    if (!participant) {
      throw new Error('You must join this event to update payment status')
    }

    await db
      .update(participantT)
      .set({ markedAsPaidAt: null })
      .where(eq(participantT.id, participant.id))

    return { success: true }
  })
