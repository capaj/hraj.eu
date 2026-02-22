import { createServerFn } from '@tanstack/react-start'
import { Event } from '../types'
import { db } from '../../drizzle/db'
import { eventStatuses, eventT, participantT } from '../../drizzle/schema'
import { eq, not, inArray, sql } from 'drizzle-orm'
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

    const eventDateTimeSql = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime})`

    const eventsFromDb = await db
      .select()
      .from(eventT)
      .where(
        statuses && statuses.length > 0
          ? inArray(eventT.status, statuses)
          : not(eq(eventT.status, 'cancelled')) // by default don't show cancelled events
      )
      .orderBy(
        sql`CASE WHEN ${eventDateTimeSql} < datetime('now') THEN 1 ELSE 0 END`,
        sql`CASE WHEN ${eventDateTimeSql} >= datetime('now') THEN ${eventDateTimeSql} END ASC`,
        sql`CASE WHEN ${eventDateTimeSql} < datetime('now') THEN ${eventDateTimeSql} END DESC`
      )
      .limit(50)

    const eventsWithParticipants = await Promise.all(
      eventsFromDb.map(async (event) => {
        const participants = await db
          .select({
            userId: participantT.userId,
            status: participantT.status,
            plusAttendees: participantT.plusAttendees
          })
          .from(participantT)
          .where(eq(participantT.eventId, event.id))

        const confirmedParticipants = participants
          .filter((p) => p.status === 'confirmed')
          .map((p) => p.userId)

        const waitlistedParticipants = participants
          .filter((p) => p.status === 'waitlisted')
          .map((p) => p.userId)

        const participantPlusOnes = participants.reduce(
          (acc, participant) => {
            acc[participant.userId] = participant.plusAttendees || []
            return acc
          },
          {} as Record<string, string[]>
        )

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
          participantPlusOnes,
          status: event.status as Event['status'],
          allowedSkillLevels: event.requiredSkillLevel
            ? [event.requiredSkillLevel]
            : undefined,
          requireSkillLevel: !!event.requiredSkillLevel,
          qrCodeImages: event.qrCodeImages || [],
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        } as Event
      })
    )

    return eventsWithParticipants
  })
