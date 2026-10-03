import { getEmailCopy, formatEmailDate, type EmailLocale } from './localization'
import type { Resend } from 'resend'

type CityEvent = {
  id: string
  title: string
  date: string
  startTime: string
}

export async function sendCitySubscriptionEmail({
  locale = 'cs',
  resend,
  from,
  to,
  cityName,
  citySlug,
  events,
  baseUrl
}: {
  locale?: EmailLocale
  resend: Resend
  from: string
  to: string
  cityName: string
  citySlug: string
  events: CityEvent[]
  baseUrl: string
}) {
  const copy = getEmailCopy(locale)
  const subject = copy.citySubject(cityName)
  const list = events
    .map(
      (event) =>
        `<li><a href="${baseUrl}/events/${event.id}">${event.title}</a> – ${formatEmailDate(event.date, locale)} ${event.startTime}</li>`
    )
    .join('')

  return resend.emails.send({
    from,
    to,
    subject,
    html: `<div><p>${copy.cityIntro(cityName)}</p><ul>${list}</ul><p>${copy.seeAllEvents}: <a href="${baseUrl}/cities/${citySlug}">${baseUrl}/cities/${citySlug}</a></p></div>`
  })
}
