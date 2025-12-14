import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { eventT } from '../../drizzle/schema'
import { db } from 'drizzle/db'
import { auth } from '~/lib/auth'
import { eq, and } from 'drizzle-orm'

const UpdateEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  sport: z.string().min(1).optional(),
  venueId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().min(1).optional(),
  duration: z.number().int().positive().optional(),
  minParticipants: z.number().int().positive().optional(),
  idealParticipants: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  cancellationHours: z.number().int().min(0).max(72).optional(),
  cancellationMinutes: z.number().int().min(0).max(59).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  paymentDetails: z.string().optional(),
  gameRules: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowedSkillLevels: z
    .array(z.enum(['beginner', 'intermediate', 'advanced']))
    .optional(),
  requireSkillLevel: z.boolean().optional()
})

export type UpdateEventData = z.infer<typeof UpdateEventSchema>

export const updateEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = UpdateEventSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      throw new Error(`Invalid event data: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to update an event')
    }

    const event = await db.query.eventT.findFirst({
      where: eq(eventT.id, data.id)
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== session.user.id) {
      throw new Error('You can only update events you organized')
    }

    const updates: Partial<typeof eventT.$inferInsert> = {}

    if (data.title) updates.title = data.title
    if (data.sport) updates.sport = data.sport
    if (data.venueId) updates.venueId = data.venueId
    if (data.date) updates.date = data.date
    if (data.startTime) updates.startTime = data.startTime
    if (data.duration) updates.duration = data.duration
    if (data.minParticipants) updates.minParticipants = data.minParticipants
    if (data.idealParticipants !== undefined)
      updates.idealParticipants = data.idealParticipants
    if (data.maxParticipants) updates.maxParticipants = data.maxParticipants

    if (
      data.cancellationHours !== undefined &&
      data.cancellationMinutes !== undefined
    ) {
      updates.cancellationDeadlineMinutes =
        data.cancellationHours * 60 + data.cancellationMinutes
    }

    if (data.price !== undefined) {
      updates.price =
        typeof data.price === 'string' && data.price !== ''
          ? Number(data.price)
          : typeof data.price === 'number'
          ? data.price
          : null
    }

    if (data.paymentDetails !== undefined)
      updates.paymentDetails = data.paymentDetails
    if (data.gameRules !== undefined) updates.gameRules = data.gameRules
    if (data.isPublic !== undefined) updates.isPublic = data.isPublic

    if (data.requireSkillLevel !== undefined) {
      if (data.requireSkillLevel) {
        updates.requiredSkillLevel =
          data.allowedSkillLevels && data.allowedSkillLevels.length === 1
            ? data.allowedSkillLevels[0]
            : null
      } else {
        updates.requiredSkillLevel = null
      }
    }

    await db.update(eventT).set(updates).where(eq(eventT.id, data.id))

    return { success: true }
  })
