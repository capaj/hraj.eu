import { createServerFn } from '@tanstack/react-start'
import { Event } from '../types'
import { db } from '../../drizzle/db'
import { eventStatuses, eventT, participantT } from '../../drizzle/schema'
import { eq, not, inArray, sql, and } from 'drizzle-orm'
import { z } from 'zod'

export const getEvents = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z
      .object({
        statuses: z
          .array(z.enum(eventStatuses))
          .optional(),
        dateRange: z
          .object({
            from: z.string().optional(), // ISO datetime string
            to: z.string().optional()    // ISO datetime string
          })
          .optional()
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => {
    const statuses = data?.statuses
    const dateRange = data?.dateRange

    // Build where conditions
    const conditions = []

    // Status filter
    if (statuses && statuses.length > 0) {
      conditions.push(inArray(eventT.status, statuses))
    } else {
      conditions.push(not(eq(eventT.status, 'cancelled'))) // by default don't show cancelled events
    }

    // Date/time range filter
    if (dateRange?.from) {
      const fromDatetime = dateRange.from.slice(0, 16).replace('T', ' ')
      conditions.push(sql`${eventT.date} || ' ' || ${eventT.startTime} >= ${fromDatetime}`)
    }
    if (dateRange?.to) {
      const toDatetime = dateRange.to.slice(0, 16).replace('T', ' ')
      conditions.push(sql`${eventT.date} || ' ' || ${eventT.startTime} <= ${toDatetime}`)
    }

    const eventsFromDb = await db
      .select()
      .from(eventT)
      .where(and(...conditions))

    const eventsWithParticipants = await Promise.all(
      eventsFromDb.map(async (event) => {
        const participants = await db
          .select({
            userId: participantT.userId,
            status: participantT.status
          })
          .from(participantT)
          .where(eq(participantT.eventId, event.id))

        const confirmedParticipants = participants
          .filter((p) => p.status === 'confirmed')
          .map((p) => p.userId)

        const waitlistedParticipants = participants
          .filter((p) => p.status === 'waitlisted')
          .map((p) => p.userId)

        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          sport: event.sport,
          venueId: event.venueId || '',
          date: new Date(event.date),
          startTime: event.startTime,
          duration: event.duration,
          minParticipants: event.minParticipants,
          idealParticipants: event.idealParticipants || undefined,
          maxParticipants: event.maxParticipants,
          cancellationDeadlineHours: event.cancellationDeadlineMinutes
            ? Math.floor(event.cancellationDeadlineMinutes / 60)
            : undefined,
          price: event.price || undefined,
          paymentDetails: event.paymentDetails || undefined,
          gameRules: event.gameRules || undefined,
          cutoffTime: new Date(
            new Date(event.date).getTime() -
            (event.cancellationDeadlineMinutes || 0) * 60 * 1000
          ),
          isPublic: event.isPublic,
          organizerId: event.organizerId,
          participants: confirmedParticipants,
          waitlist: waitlistedParticipants,
          status: event.status as Event['status'],
          allowedSkillLevels: event.requiredSkillLevel
            ? [event.requiredSkillLevel]
            : undefined,
          requireSkillLevel: !!event.requiredSkillLevel,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        } as Event
      })
    )

    return eventsWithParticipants
  })
