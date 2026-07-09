import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import {
  coreGroupT,
  eventT,
  participantT,
  user,
  venueT
} from '../../drizzle/schema'
import { db } from 'drizzle/db'
import { auth } from '~/lib/auth'
import { eq, and, inArray } from 'drizzle-orm'
import { assertNoVenueEventConflict } from './eventVenueConflicts'
import { env } from 'cloudflare:workers'
import { Resend } from 'resend'
import { sendVenueChangeEmail } from '~/lib/email/sendVenueChangeEmail'
import type { EmailLocale } from '~/lib/email/sendCancellationEmail'

const LOCATION_FALLBACK = 'Location TBD'
const resend = new Resend(env.RESEND_API_KEY)

const UpdateEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  sport: z.string().min(1).optional(),
  venueId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().min(1).optional(),
  duration: z.number().int().positive().optional(),
  minParticipants: z.number().int().positive().optional(),
  idealParticipants: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  reservedParticipants: z.number().int().min(0).optional(),
  cancellationHours: z.number().int().min(0).max(72).optional(),
  cancellationMinutes: z.number().int().min(0).max(59).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  paymentDetails: z.string().optional(),
  gameRules: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowedSkillLevels: z
    .array(z.enum(['beginner', 'intermediate', 'advanced']))
    .optional(),
  requireSkillLevel: z.boolean().optional(),
  qrCodeImages: z.array(z.string()).optional(),
  coreGroupId: z.string().min(1).optional(),
  coreGroupExclusiveHours: z.number().int().min(2).max(24 * 14).optional(),
  clearCoreGroup: z.boolean().optional()
})

export type UpdateEventData = z.infer<typeof UpdateEventSchema>

export const updateEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = UpdateEventSchema.safeParse(payload)
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
      throw new Error('You must be logged in to update an event')
    }

    const event = await db.query.eventT.findFirst({
      where: eq(eventT.id, data.id)
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== session.user.id) {
      throw new Error('You can only update events you organized')
    }

    const previousVenue = event.venueId
      ? await db.query.venueT.findFirst({ where: eq(venueT.id, event.venueId) })
      : null

    const organizerId = session.user.id
    const updates: Partial<typeof eventT.$inferInsert> = {}

    if (data.clearCoreGroup) {
      updates.coreGroupId = null
      updates.coreGroupExclusiveUntil = null
    } else if (data.coreGroupId) {
      const group = await db.query.coreGroupT.findFirst({
        where: and(
          eq(coreGroupT.id, data.coreGroupId),
          eq(coreGroupT.createdBy, organizerId)
        )
      })

      if (!group) {
        throw new Error('Selected core group does not exist')
      }

      updates.coreGroupId = group.id
      if (data.coreGroupExclusiveHours !== undefined) {
        const now = new Date()
        updates.coreGroupExclusiveUntil = new Date(
          now.getTime() + data.coreGroupExclusiveHours * 60 * 60 * 1000
        )
      }
    }

    if (data.title) updates.title = data.title
    if (data.sport) updates.sport = data.sport
    if (data.venueId) updates.venueId = data.venueId
    if (data.date) updates.date = data.date
    if (data.startTime) updates.startTime = data.startTime
    if (data.duration) updates.duration = data.duration
    if (data.minParticipants) updates.minParticipants = data.minParticipants
    if (data.idealParticipants !== undefined)
      updates.idealParticipants = data.idealParticipants
    if (data.maxParticipants) updates.maxParticipants = data.maxParticipants
    if (data.reservedParticipants !== undefined) {
      const maxParticipants = data.maxParticipants ?? event.maxParticipants
      updates.reservedParticipants = Math.max(
        0,
        Math.min(data.reservedParticipants, Math.max(maxParticipants - 1, 0))
      )
    }

    if (
      data.cancellationHours !== undefined &&
      data.cancellationMinutes !== undefined
    ) {
      updates.cancellationDeadlineMinutes =
        data.cancellationHours * 60 + data.cancellationMinutes
    }

    if (data.price !== undefined) {
      if (typeof data.price === 'string' && data.price !== '') {
        updates.price = Number(data.price)
      } else if (typeof data.price === 'number') {
        updates.price = data.price
      } else {
        updates.price = null
      }
    }

    if (data.currency) updates.currency = data.currency

    if (data.paymentDetails !== undefined)
      updates.paymentDetails = data.paymentDetails
    if (data.gameRules !== undefined) updates.gameRules = data.gameRules
    if (data.isPublic !== undefined) updates.isPublic = data.isPublic
    if (data.qrCodeImages !== undefined) {
      updates.qrCodeImages = data.qrCodeImages
    }

    if (data.requireSkillLevel !== undefined) {
      if (data.requireSkillLevel) {
        updates.requiredSkillLevel =
          data.allowedSkillLevels && data.allowedSkillLevels.length === 1
            ? data.allowedSkillLevels[0]
            : null
      } else {
        updates.requiredSkillLevel = null
      }
    }

    await assertNoVenueEventConflict(db, {
      venueId: data.venueId ?? event.venueId,
      date: data.date ?? event.date,
      startTime: data.startTime ?? event.startTime,
      duration: data.duration ?? event.duration,
      excludeEventId: event.id
    })

    await db.update(eventT).set(updates).where(eq(eventT.id, data.id))

    let venueChangeEmailsSent = 0
    if (data.venueId && data.venueId !== event.venueId) {
      venueChangeEmailsSent = await notifyAttendeesAboutVenueChange({
        event: {
          id: event.id,
          title: updates.title ?? event.title,
          description: updates.description ?? event.description,
          date: updates.date ?? event.date,
          startTime: updates.startTime ?? event.startTime,
          duration: updates.duration ?? event.duration
        },
        previousVenue: formatLocation(
          previousVenue?.name,
          previousVenue?.address
        ),
        newVenueId: data.venueId,
        request
      })
    }

    return { success: true, venueChangeEmailsSent }
  })

async function notifyAttendeesAboutVenueChange({
  event,
  previousVenue,
  newVenueId,
  request
}: {
  event: {
    id: string
    title: string
    description: string | null
    date: string
    startTime: string
    duration: number
  }
  previousVenue: string
  newVenueId: string
  request: Request
}): Promise<number> {
  const newVenue = await db.query.venueT.findFirst({
    where: eq(venueT.id, newVenueId)
  })
  const participants = await db
    .select({ email: user.email, name: user.name })
    .from(participantT)
    .innerJoin(user, eq(user.id, participantT.userId))
    .where(
      and(
        eq(participantT.eventId, event.id),
        inArray(participantT.status, ['confirmed', 'waitlisted', 'invited'])
      )
    )

  const newVenueLocation = formatLocation(newVenue?.name, newVenue?.address)
  const eventUrl = new URL(`/events/${event.id}`, request.url).toString()
  const locale = getEmailLocale(request.headers.get('accept-language'))

  const sendResults = await Promise.all(
    participants
      .filter((participant) => Boolean(participant.email))
      .map(async (participant) => {
        try {
          await sendVenueChangeEmail({
            resend,
            from: env.SENDER_EMAIL,
            to: participant.email,
            name: participant.name,
            event,
            previousVenue,
            newVenue: newVenueLocation,
            eventUrl,
            locale
          })
          return true
        } catch (error) {
          console.error(
            `Failed to send venue change email for event ${event.id} to ${participant.email}`,
            error
          )
          return false
        }
      })
  )

  return sendResults.filter(Boolean).length
}

function formatLocation(
  name: string | null | undefined,
  address: string | null | undefined
): string {
  const parts = [name?.trim(), address?.trim()].filter(
    (part): part is string => Boolean(part)
  )
  return parts.length ? parts.join(', ') : LOCATION_FALLBACK
}

function getEmailLocale(acceptLanguage: string | null): EmailLocale {
  if (!acceptLanguage) {
    return 'cs'
  }

  return acceptLanguage
    .split(',')
    .map((language) => language.trim().toLowerCase())
    .some((language) => language.startsWith('en'))
    ? 'en'
    : 'cs'
}
