import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { recurringEventT } from '../../drizzle/schema'
import { auth } from './auth'
import { getRequest } from '@tanstack/react-start/server'

const RecurringEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sport: z.string().min(1, 'Sport is required'),
  venueId: z.string().min(1, 'Venue is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().int().positive(),
  minParticipants: z.number().int().positive(),
  idealParticipants: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive(),
  cancellationHours: z.number().int().min(0).max(72),
  cancellationMinutes: z.number().int().min(0).max(59),
  price: z.union([z.number(), z.string()]).optional(),
  paymentDetails: z.string().optional(),
  gameRules: z.string().optional(),
  isPublic: z.boolean().default(true),
  requiredSkillLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional(),
  // Recurrence specific fields
  recurrenceType: z.enum(['days', 'weeks']),
  intervalValue: z.number().int().min(1).max(365), // 1-365 days or 1-52 weeks
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

type RecurringEventInput = z.infer<typeof RecurringEventSchema>

export const createRecurringEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = RecurringEventSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      throw new Error(`Invalid recurring event data: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }: { data: RecurringEventInput }) => {
    // Get current user from session
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to create a recurring event')
    }

    const organizerId = session.user.id

    // Convert cancellation hours + minutes to total minutes
    const cancellationDeadlineMinutes =
      data.cancellationHours * 60 + data.cancellationMinutes

    // Handle price conversion
    const numericPrice =
      typeof data.price === 'string' && data.price !== ''
        ? Number(data.price)
        : typeof data.price === 'number'
        ? data.price
        : undefined

    // Determine interval in days or weeks
    const intervalDays =
      data.recurrenceType === 'days' ? data.intervalValue : null
    const intervalWeeks =
      data.recurrenceType === 'weeks' ? data.intervalValue : null

    // Validate that at least one interval is set
    if (!intervalDays && !intervalWeeks) {
      throw new Error('Invalid recurrence configuration')
    }

    // Build insert data
    const insertData = {
      title: data.title,
      description: data.description,
      sport: data.sport,
      venueId: data.venueId,
      startTime: data.startTime,
      duration: data.duration,
      minParticipants: data.minParticipants,
      idealParticipants: data.idealParticipants,
      maxParticipants: data.maxParticipants,
      cancellationDeadlineMinutes,
      price: numericPrice,
      paymentDetails: data.paymentDetails,
      gameRules: data.gameRules,
      isPublic: data.isPublic,
      organizerId,
      requiredSkillLevel: data.requiredSkillLevel,
      intervalDays,
      intervalWeeks,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: true
    }

    const inserted = await db
      .insert(recurringEventT)
      .values(insertData)
      .returning()

    return inserted?.[0] ?? insertData
  })
