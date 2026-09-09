import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventT, participantT, user } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import {
  canViewEventParticipantPhones,
  getConfirmedParticipantIds
} from '~/utils/eventParticipantPhones'

export const getEventParticipantPhones = createServerFn({ method: 'GET' })
  .validator((input: unknown) =>
    z.object({ eventId: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    const [event] = await db
      .select({ organizerId: eventT.organizerId })
      .from(eventT)
      .where(eq(eventT.id, data.eventId))
      .limit(1)

    if (!event) {
      throw new Error(`Event with id ${data.eventId} not found`)
    }

    const participants = await db
      .select({
        userId: participantT.userId,
        status: participantT.status
      })
      .from(participantT)
      .where(eq(participantT.eventId, data.eventId))

    if (
      !canViewEventParticipantPhones(
        session?.user?.id,
        event.organizerId,
        participants
      )
    ) {
      return {}
    }

    const confirmedParticipantIds = getConfirmedParticipantIds(participants)
    if (confirmedParticipantIds.length === 0) return {}

    const phoneRows = await db
      .select({ id: user.id, phone: user.phone })
      .from(user)
      .where(inArray(user.id, confirmedParticipantIds))

    return Object.fromEntries(
      phoneRows.flatMap(({ id, phone }) =>
        phone?.trim() ? [[id, phone] as const] : []
      )
    )
  })
