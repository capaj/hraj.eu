import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { auth } from '~/lib/auth'
import { setManualPaymentHandler } from './setManualPaymentHandler'

const UnmarkParticipantAsPaidSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  targetUserId: z.string().min(1).optional()
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

    return setManualPaymentHandler(db, {
      eventId: data.eventId,
      actorId: session.user.id,
      targetUserId: data.targetUserId,
      paid: false
    })
  })
