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
  resend,
  from,
  to,
  venueName,
  events,
  baseUrl
}: {
  resend: Resend
  from: string
  to: string
  venueName: string
  events: VenueEvent[]
  baseUrl: string
}) {
  const safeVenueName = escapeHtml(venueName)
  const list = events
    .map((event) => {
      const eventUrl = `${baseUrl}/events/${encodeURIComponent(event.id)}`
      return `<li><a href="${eventUrl}">${escapeHtml(event.title)}</a> – ${escapeHtml(event.date)} ${escapeHtml(event.startTime)}</li>`
    })
    .join('')

  const result = await resend.emails.send({
    from,
    to,
    subject: `New upcoming events at ${venueName}`,
    html: `<div><p>New events were added at ${safeVenueName}:</p><ul>${list}</ul><p>Browse all venues: <a href="${baseUrl}/venues">${baseUrl}/venues</a></p></div>`
  })

  if (result.error) {
    throw new Error(`Could not send venue subscription email: ${result.error.message}`)
  }

  return result
}
