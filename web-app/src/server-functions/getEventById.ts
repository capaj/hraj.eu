import { createServerFn } from '@tanstack/react-start'
import { Event } from '../types'
import { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator((eventId: string) => eventId)
  .handler(async ({ data: eventId }) => {
    const events = await db
      .select()
      .from(eventT)
      .where(eq(eventT.id, eventId))
      .limit(1)

    if (!events || events.length === 0) {
      throw new Error(`Event with id ${eventId} not found`)
    }

    const event = events[0]

    const participants = await db
      .select({
        userId: participantT.userId,
        status: participantT.status,
        plusAttendees: participantT.plusAttendees,
        markedAsPaidAt: participantT.markedAsPaidAt
      })
      .from(participantT)
      .where(eq(participantT.eventId, event.id))

    const confirmedParticipants = participants
      .filter((p) => p.status === 'confirmed')
      .map((p) => p.userId)

    const waitlistedParticipants = participants
      .filter((p) => p.status === 'waitlisted')
      .map((p) => p.userId)

    const paidParticipants = participants
      .filter((p) => p.markedAsPaidAt)
      .map((p) => p.userId)

    const paidParticipantsAt = participants.reduce(
      (acc, participant) => {
        if (participant.markedAsPaidAt) {
          acc[participant.userId] = new Date(participant.markedAsPaidAt)
        }
        return acc
      },
      {} as Record<string, Date>
    )

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
      currency: event.currency || 'CZK',
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
      paidParticipants,
      paidParticipantsAt,
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
