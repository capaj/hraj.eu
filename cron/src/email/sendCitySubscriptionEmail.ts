import type { Resend } from 'resend'

type CityEvent = {
  id: string
  title: string
  date: string
  startTime: string
}

export async function sendCitySubscriptionEmail({
  resend,
  from,
  to,
  cityName,
  citySlug,
  events,
  baseUrl
}: {
  resend: Resend
  from: string
  to: string
  cityName: string
  citySlug: string
  events: CityEvent[]
  baseUrl: string
}) {
  const subject = `New upcoming events in ${cityName}`
  const list = events
    .map(
      (event) =>
        `<li><a href="${baseUrl}/events/${event.id}">${event.title}</a> – ${event.date} ${event.startTime}</li>`
    )
    .join('')

  return resend.emails.send({
    from,
    to,
    subject,
    html: `<div><p>New events were added in ${cityName}:</p><ul>${list}</ul><p>See all events: <a href="${baseUrl}/cities/${citySlug}">${baseUrl}/cities/${citySlug}</a></p></div>`
  })
}
