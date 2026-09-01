import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { deleteOgImageFromR2 } from './utils'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventT, participantT, user } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { eq } from 'drizzle-orm'
import { getEventGuestNames, normalizeEventGuests } from '~/lib/eventGuests'
import { validateEventGuests } from './validateEventGuests'

const MAX_GUESTS_PER_USER = 2

const EventGuestSchema = z.union([
  z.string().min(1, 'Guest name is required').trim(),
  z.object({
    name: z.string().min(1, 'Guest name is required').trim(),
    userId: z.string().min(1).optional()
  })
])

const JoinEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  plusAttendees: z.array(EventGuestSchema).optional()
})

export const joinEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = JoinEventSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid join payload: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to join an event')
    }

    const [event] = await db
      .select()
      .from(eventT)
      .where(eq(eventT.id, data.eventId))
      .limit(1)

    if (!event) {
      throw new Error('Event not found')
    }

    const allParticipants = await db
      .select()
      .from(participantT)
      .where(eq(participantT.eventId, data.eventId))

    const existingParticipant = allParticipants.find(
      (p) => p.userId === session.user.id
    )

    const [currentUser] = await db
      .select({ eventJoinBannedUntil: user.eventJoinBannedUntil })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const isAlreadyAttending =
      existingParticipant?.status === 'confirmed' ||
      existingParticipant?.status === 'waitlisted'
    const hasActiveEventJoinBan =
      !!currentUser?.eventJoinBannedUntil &&
      currentUser.eventJoinBannedUntil.getTime() > Date.now()

    if (hasActiveEventJoinBan && !isAlreadyAttending) {
      throw new Error(
        'Your account is temporarily restricted from joining new games.'
      )
    }

    const requestedPlusAttendees = await validateEventGuests(
      db,
      normalizeEventGuests(
        data.plusAttendees ?? existingParticipant?.plusAttendees ?? []
      ).slice(0, MAX_GUESTS_PER_USER),
      allParticipants,
      session.user.id
    )

    const confirmedHeadcount = allParticipants
      .filter((p) => p.status === 'confirmed')
      .reduce((total, participant) => {
        const extras = participant.plusAttendees?.length ?? 0
        return total + 1 + extras
      }, 0)

    const confirmedCount = allParticipants.filter(
      (p) => p.status === 'confirmed'
    ).length
    const waitlistCount = allParticipants.filter(
      (p) => p.status === 'waitlisted'
    ).length

    const existingConfirmedLoad =
      existingParticipant?.status === 'confirmed'
        ? 1 + (existingParticipant.plusAttendees?.length ?? 0)
        : 0

    const availableSpots =
      event.maxParticipants -
      (event.reservedParticipants ?? 0) -
      (confirmedHeadcount - existingConfirmedLoad)

    const requestedHeadcount = 1 + requestedPlusAttendees.length

    if (
      existingParticipant?.status === 'confirmed' &&
      requestedHeadcount > availableSpots
    ) {
      throw new Error('Not enough spots for you and your guests right now.')
    }

    const isSpotAvailable = requestedHeadcount <= availableSpots
    const status = isSpotAvailable ? 'confirmed' : 'waitlisted'
    const ordinal =
      status === 'confirmed'
        ? confirmedCount + 1
        : confirmedCount + waitlistCount + 1

    if (existingParticipant) {
      // Rejoining after cancellation or accepting invite
      await db
        .update(participantT)
        .set({
          status,
          confirmedParticipantOrdinal: ordinal,
          plusAttendees: requestedPlusAttendees
        })
        .where(eq(participantT.id, existingParticipant.id))
    } else {
      // New join
      await db.insert(participantT).values({
        eventId: data.eventId,
        userId: session.user.id,
        status,
        confirmedParticipantOrdinal: ordinal,
        plusAttendees: requestedPlusAttendees
      })
    }

    const participants = await getParticipants(data.eventId)
    
    // Invalidate OG image cache, ignore if it errors
    void deleteOgImageFromR2(data.eventId).catch((e) => {
      console.error('Failed to delete OG image from R2:', e)
    })

    return {
      status,
      participants
    }
  })

async function getParticipants(eventId: string) {
  const participants = await db
    .select({
      userId: participantT.userId,
      status: participantT.status,
      plusAttendees: participantT.plusAttendees,
      createdAt: participantT.createdAt
    })
    .from(participantT)
    .where(eq(participantT.eventId, eventId))

  const participantPlusOnes = participants.reduce(
    (acc, participant) => {
      acc[participant.userId] = getEventGuestNames(participant.plusAttendees)
      return acc
    },
    {} as Record<string, string[]>
  )

  const participantGuests = participants.reduce(
    (acc, participant) => {
      acc[participant.userId] = normalizeEventGuests(participant.plusAttendees)
      return acc
    },
    {} as Record<string, ReturnType<typeof normalizeEventGuests>>
  )

  return {
    confirmed: participants
      .filter((p) => p.status === 'confirmed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => p.userId),
    waitlisted: participants
      .filter((p) => p.status === 'waitlisted')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((p) => p.userId),
    plusAttendees: participantPlusOnes,
    guests: participantGuests,
    participantJoinedAt: participants
      .filter((p) => p.status === 'confirmed')
      .reduce(
        (acc, participant) => {
          acc[participant.userId] = new Date(participant.createdAt)
          return acc
        },
        {} as Record<string, Date>
      ),
    waitlistJoinedAt: participants
      .filter((p) => p.status === 'waitlisted')
      .reduce(
        (acc, participant) => {
          acc[participant.userId] = new Date(participant.createdAt)
          return acc
        },
        {} as Record<string, Date>
      )
  }
}
