import { getEmailCopy, formatEmailDate, type EmailLocale } from './localization'
import type { Resend } from 'resend'

type VenueEvent = {
  id: string
  title: string
  date: string
  startTime: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendVenueSubscriptionEmail({
  locale = 'cs',
  resend,
  from,
  to,
  venueName,
  events,
  baseUrl
}: {
  locale?: EmailLocale
  resend: Resend
  from: string
  to: string
  venueName: string
  events: VenueEvent[]
  baseUrl: string
}) {
  const copy = getEmailCopy(locale)
  const safeVenueName = escapeHtml(venueName)
  const list = events
    .map((event) => {
      const eventUrl = `${baseUrl}/events/${encodeURIComponent(event.id)}`
      return `<li><a href="${eventUrl}">${escapeHtml(event.title)}</a> – ${escapeHtml(formatEmailDate(event.date, locale))} ${escapeHtml(event.startTime)}</li>`
    })
    .join('')

  const result = await resend.emails.send({
    from,
    to,
    subject: copy.venueSubject(venueName),
    html: `<div><p>${copy.venueIntro(safeVenueName)}</p><ul>${list}</ul><p>${copy.browseVenues}: <a href="${baseUrl}/venues">${baseUrl}/venues</a></p></div>`
  })

  if (result.error) {
    throw new Error(`Could not send venue subscription email: ${result.error.message}`)
  }

  return result
}
