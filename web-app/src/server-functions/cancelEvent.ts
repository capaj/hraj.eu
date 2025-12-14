import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { eventT } from '../../drizzle/schema'
import { db } from 'drizzle/db'
import { auth } from '~/lib/auth'
import { eq } from 'drizzle-orm'

const CancelEventSchema = z.object({
  eventId: z.string().min(1),
  reason: z.string().optional()
})

export const cancelEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    return CancelEventSchema.parse(payload)
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to cancel an event')
    }

    const event = await db.query.eventT.findFirst({
      where: eq(eventT.id, data.eventId)
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== session.user.id) {
      throw new Error('You can only cancel events you organized')
    }

    if (event.status === 'cancelled') {
        return { success: true }
    }

    await db
      .update(eventT)
      .set({
        status: 'cancelled',
        cancellationReason: data.reason,
        cancellationCheckRanAt: new Date()
      })
      .where(eq(eventT.id, data.eventId))
    
    // TODO: Send notifications to participants (skipped for now as per immediate scope)

    return { success: true }
  })
