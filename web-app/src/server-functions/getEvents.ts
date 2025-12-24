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
          .optional()
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => {
    const statuses = data?.statuses

    // Calculate cutoff time: 8 hours ago
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)
    // Format as "YYYY-MM-DD HH:MM" to match SQLite datetime format
    const cutoffDatetime = eightHoursAgo.toISOString().slice(0, 16).replace('T', ' ')

    const eventsFromDb = await db
      .select()
      .from(eventT)
      .where(
        and(
          // Status filter
          statuses && statuses.length > 0
            ? inArray(eventT.status, statuses)
            : not(eq(eventT.status, 'cancelled')), // by default don't show cancelled events
          // Date/time filter: show events that start after (now - 8 hours)
          sql`${eventT.date} || ' ' || ${eventT.startTime} >= ${cutoffDatetime}`
        )
      )

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
