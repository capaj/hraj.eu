import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { eventT, participantT, user, venueT } from '../../drizzle/schema'
import { db } from 'drizzle/db'
import { auth } from '~/lib/auth'
import { and, eq, inArray, not } from 'drizzle-orm'
import { env } from 'cloudflare:workers'
import { Resend } from 'resend'
import { msg } from '@lingui/core/macro'
import {
  createEmailI18n,
  sendCancellationEmail,
  type EmailLocale
} from '~/lib/email/sendCancellationEmail'

const LOCATION_FALLBACK = 'Location TBD'
const resend = new Resend(env.RESEND_API_KEY)

const CancelEventSchema = z.object({
  eventId: z.string().min(1),
  reason: z.string().optional()
})

export const cancelEvent = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    return CancelEventSchema.parse(payload)
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to cancel an event')
    }

    const [event] = await db
      .select({
        id: eventT.id,
        title: eventT.title,
        description: eventT.description,
        date: eventT.date,
        startTime: eventT.startTime,
        duration: eventT.duration,
        organizerId: eventT.organizerId,
        status: eventT.status,
        venueName: venueT.name,
        venueAddress: venueT.address
      })
      .from(eventT)
      .leftJoin(venueT, eq(venueT.id, eventT.venueId))
      .where(eq(eventT.id, data.eventId))
      .limit(1)

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.organizerId !== session.user.id) {
      throw new Error('You can only cancel events you organized')
    }

    if (event.status === 'cancelled') {
      return { success: true }
    }

    const locale = getEmailLocale(request.headers.get('accept-language'))
    const emailI18n = createEmailI18n(locale)
    const reason =
      data.reason?.trim() || emailI18n._(msg`Cancelled by organizer`)

    const updated = await db
      .update(eventT)
      .set({
        status: 'cancelled',
        cancellationReason: reason,
        cancellationCheckRanAt: new Date()
      })
      .where(
        and(eq(eventT.id, data.eventId), not(eq(eventT.status, 'cancelled')))
      )
      .returning({ id: eventT.id })

    if (!updated.length) {
      return { success: true }
    }

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

    const location = formatLocation(event.venueName, event.venueAddress)
    const eventUrl = new URL(`/events/${event.id}`, request.url).toString()

    let emailsSent = 0
    for (const participant of participants) {
      if (!participant.email) {
        continue
      }

      try {
        await sendCancellationEmail({
          resend,
          from: env.SENDER_EMAIL,
          to: participant.email,
          name: participant.name,
          event,
          location,
          eventUrl,
          reason,
          locale
        })
        emailsSent += 1
      } catch (error) {
        console.error(
          `Failed to send cancellation email for event ${event.id} to ${participant.email}`,
          error
        )
      }
    }

    return { success: true, emailsSent }
  })

function formatLocation(name: string | null, address: string | null): string {
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
