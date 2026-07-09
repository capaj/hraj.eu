import { msg } from '@lingui/core/macro'
import type { Resend } from 'resend'
import { escapeHtml } from './utils'
import {
  createEmailI18n,
  type CancellationEmailEvent,
  type EmailLocale
} from './sendCancellationEmail'

export interface VenueChangeEmailEvent extends CancellationEmailEvent {}

export async function sendVenueChangeEmail({
  resend,
  from,
  to,
  name,
  event,
  previousVenue,
  newVenue,
  eventUrl,
  locale
}: {
  resend: Resend
  from: string
  to: string
  name: string | null
  event: VenueChangeEmailEvent
  previousVenue: string
  newVenue: string
  eventUrl: string
  locale: EmailLocale
}) {
  const i18n = createEmailI18n(locale)
  const title = event.title
  const greeting = name ? i18n._(msg`Hi ${name},`) : i18n._(msg`Hi,`)
  const when = `${event.date} ${event.startTime} (${event.duration} min)`
  const description = event.description?.trim()
  const heading = i18n._(msg`Event venue changed`)
  const changedText = i18n._(msg`has a new venue.`)
  const whenLabel = i18n._(msg`When`)
  const previousVenueLabel = i18n._(msg`Previous venue`)
  const newVenueLabel = i18n._(msg`New venue`)
  const viewEventText = i18n._(msg`View event`)
  const plainText = [
    greeting,
    '',
    i18n._(msg`The venue changed for your event: ${title}`),
    i18n._(msg`When: ${when}`),
    i18n._(msg`Previous venue: ${previousVenue}`),
    i18n._(msg`New venue: ${newVenue}`),
    description ? '' : null,
    description || null,
    '',
    i18n._(msg`View event: ${eventUrl}`)
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${escapeHtml(heading)}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${escapeHtml(changedText)}</p>
      <p><strong>${escapeHtml(whenLabel)}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${escapeHtml(previousVenueLabel)}:</strong> ${escapeHtml(previousVenue)}</p>
      <p><strong>${escapeHtml(newVenueLabel)}:</strong> ${escapeHtml(newVenue)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">${escapeHtml(viewEventText)}</a></p>
    </div>
  `

  const response = await resend.emails.send({
    from,
    to,
    subject: i18n._(msg`Event venue changed: ${title}`),
    html,
    text: plainText
  })

  if (response.error) {
    throw new Error(
      `Resend API error (${response.error.statusCode ?? 'unknown'}): ${
        response.error.message
      }`
    )
  }
}
