import { createServerFn } from '@tanstack/react-start'
import { Event } from '../types'
import { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'
import { and, eq, gte, not } from 'drizzle-orm'

export const getUpcomingEvents = createServerFn({ method: 'GET' })
  .inputValidator((limit?: number) => limit || 3)
  .handler(async ({ data: limit }) => {
    const today = new Date().toISOString().split('T')[0]

    const eventsFromDb = await db
      .select()
      .from(eventT)
      .where(and(gte(eventT.date, today), eq(eventT.isPublic, true), not(eq(eventT.status, 'cancelled'))))

      .limit(limit)

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
          currency: event.currency || 'CZK',
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
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        } as Event
      })
    )

    return eventsWithParticipants.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )
  })
