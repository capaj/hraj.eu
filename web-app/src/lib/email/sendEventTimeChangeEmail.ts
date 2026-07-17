import { msg } from '@lingui/core/macro'
import type { Resend } from 'resend'
import { escapeHtml } from './utils'
import {
  createEmailI18n,
  type CancellationEmailEvent,
  type EmailLocale
} from './sendCancellationEmail'

export type EventTiming = Pick<
  CancellationEmailEvent,
  'date' | 'startTime' | 'duration'
>

export async function sendEventTimeChangeEmail({
  resend,
  from,
  to,
  name,
  event,
  previousTiming,
  eventUrl,
  locale
}: {
  resend: Resend
  from: string
  to: string
  name: string | null
  event: CancellationEmailEvent
  previousTiming: EventTiming
  eventUrl: string
  locale: EmailLocale
}) {
  const i18n = createEmailI18n(locale)
  const title = event.title
  const greeting = name ? i18n._(msg`Hi ${name},`) : i18n._(msg`Hi,`)
  const previousWhen = formatTiming(previousTiming)
  const newWhen = formatTiming(event)
  const description = event.description?.trim()
  const heading = i18n._(msg`Event time changed`)
  const changedText = i18n._(msg`has a new time.`)
  const previousTimeLabel = i18n._(msg`Previous time`)
  const newTimeLabel = i18n._(msg`New time`)
  const viewEventText = i18n._(msg`View event`)
  const plainText = [
    greeting,
    '',
    i18n._(msg`The time changed for your event: ${title}`),
    i18n._(msg`Previous time: ${previousWhen}`),
    i18n._(msg`New time: ${newWhen}`),
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
      <p><strong>${escapeHtml(previousTimeLabel)}:</strong> ${escapeHtml(previousWhen)}</p>
      <p><strong>${escapeHtml(newTimeLabel)}:</strong> ${escapeHtml(newWhen)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">${escapeHtml(viewEventText)}</a></p>
    </div>
  `

  const response = await resend.emails.send({
    from,
    to,
    subject: i18n._(msg`Event time changed: ${title}`),
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

function formatTiming(timing: EventTiming): string {
  return `${timing.date} ${timing.startTime} (${timing.duration} min)`
}
