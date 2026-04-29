import { createServerFn } from '@tanstack/react-start'
import { Event } from '../types'
import { db } from '../../drizzle/db'
import { coreGroupMemberT, coreGroupT, eventT, participantT } from '../../drizzle/schema'
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
        markedAsPaidAt: participantT.markedAsPaidAt,
        createdAt: participantT.createdAt
      })
      .from(participantT)
      .where(eq(participantT.eventId, event.id))

    const confirmedParticipants = participants
      .filter((p) => p.status === 'confirmed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => p.userId)

    const waitlistedParticipants = participants
      .filter((p) => p.status === 'waitlisted')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
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

    const participantJoinedAt = participants
      .filter((p) => p.status === 'confirmed')
      .reduce(
        (acc, participant) => {
          acc[participant.userId] = new Date(participant.createdAt)
          return acc
        },
        {} as Record<string, Date>
      )

    const waitlistJoinedAt = participants
      .filter((p) => p.status === 'waitlisted')
      .reduce(
        (acc, participant) => {
          acc[participant.userId] = new Date(participant.createdAt)
          return acc
        },
        {} as Record<string, Date>
      )


    let coreGroupName: string | undefined
    let coreGroupUserIds: string[] | undefined

    if (event.coreGroupId) {
      const coreGroup = await db
        .select({ id: coreGroupT.id, name: coreGroupT.name })
        .from(coreGroupT)
        .where(eq(coreGroupT.id, event.coreGroupId))
        .limit(1)

      coreGroupName = coreGroup[0]?.name

      const coreMembers = await db
        .select({ userId: coreGroupMemberT.userId })
        .from(coreGroupMemberT)
        .where(eq(coreGroupMemberT.coreGroupId, event.coreGroupId))

      coreGroupUserIds = coreMembers.map((member) => member.userId)
    }

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
      participantJoinedAt,
      waitlistJoinedAt,
      status: event.status as Event['status'],
      allowedSkillLevels: event.requiredSkillLevel
        ? [event.requiredSkillLevel]
        : undefined,
      requireSkillLevel: !!event.requiredSkillLevel,
      qrCodeImages: event.qrCodeImages || [],
      coreGroupId: event.coreGroupId || undefined,
      coreGroupName,
      coreGroupUserIds,
      coreGroupExclusiveUntil: event.coreGroupExclusiveUntil
        ? new Date(event.coreGroupExclusiveUntil)
        : undefined,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    } as Event
  })
