import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createInsertSchema } from 'drizzle-zod'
import { coreGroupT, eventT as eventTable } from '../../drizzle/schema'
import { db } from '../../drizzle/db'
import { and, eq } from 'drizzle-orm'
import { auth } from './auth'

const ClientEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sport: z.string().min(1, 'Sport is required'),
  venueId: z.string().min(1, 'Venue is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().int().positive(),
  minParticipants: z.number().int().positive(),
  idealParticipants: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive(),
  cancellationHours: z.number().int().min(0).max(72),
  cancellationMinutes: z.number().int().min(0).max(59),
  price: z.union([z.number(), z.string()]).optional(),
  currency: z.string().default('CZK'),
  paymentDetails: z.string().optional(),
  gameRules: z.string().optional(),
  isPublic: z.boolean().default(true),
  allowedSkillLevels: z
    .array(z.enum(['beginner', 'intermediate', 'advanced']))
    .default(['beginner', 'intermediate', 'advanced'])
    .optional(),
  requireSkillLevel: z.boolean().optional(),
  coreGroupId: z.string().min(1).optional(),
  coreGroupExclusiveHours: z.number().int().min(2).max(24 * 14).optional()
})

const EventInsertSchema = createInsertSchema(eventTable)

type InsertedEvent = z.infer<typeof EventInsertSchema>

export const createEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = ClientEventSchema.safeParse(payload)
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
      throw new Error('You must be logged in to create an event')
    }

    const organizerId = session.user.id

    const cancellationDeadlineMinutes =
      data.cancellationHours * 60 + data.cancellationMinutes

    const numericPrice =
      typeof data.price === 'string' && data.price !== ''
        ? Number(data.price)
        : typeof data.price === 'number'
        ? data.price
        : undefined

    const requiredSkillLevel = data.requireSkillLevel
      ? data.allowedSkillLevels && data.allowedSkillLevels.length === 1
        ? data.allowedSkillLevels[0]
        : undefined
      : undefined

    let validatedCoreGroupId: string | undefined
    if (data.coreGroupId) {
      const group = await db.query.coreGroupT.findFirst({
        where: and(
          eq(coreGroupT.id, data.coreGroupId),
          eq(coreGroupT.createdBy, organizerId)
        )
      })

      if (!group) {
        throw new Error('Selected core group does not exist')
      }

      validatedCoreGroupId = group.id
    }

    const now = new Date()
    const coreGroupExclusiveUntil =
      validatedCoreGroupId && data.coreGroupExclusiveHours
        ? new Date(now.getTime() + data.coreGroupExclusiveHours * 60 * 60 * 1000)
        : undefined

    const insertData: Partial<InsertedEvent> = {
      title: data.title,
      sport: data.sport,
      venueId: data.venueId,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      minParticipants: data.minParticipants,
      idealParticipants: data.idealParticipants,
      maxParticipants: data.maxParticipants,
      cancellationDeadlineMinutes,
      price: numericPrice,
      currency: data.currency,
      paymentDetails: data.paymentDetails,
      gameRules: data.gameRules,
      isPublic: data.isPublic,
      coreGroupId: validatedCoreGroupId,
      coreGroupExclusiveUntil,
      organizerId,
      requiredSkillLevel
    }

    const validated = EventInsertSchema.parse(insertData)
    const inserted = await db.insert(eventTable).values(validated).returning()
    return inserted?.[0] ?? validated
  })
