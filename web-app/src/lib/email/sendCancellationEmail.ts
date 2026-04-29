import { setupI18n, type I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { Resend } from 'resend'
import { messages as csMessages } from '../../../app/locales/cs.mjs'
import { messages as enMessages } from '../../../app/locales/en.mjs'
import { escapeHtml } from './utils'

export type EmailLocale = 'en' | 'cs'

export interface CancellationEmailEvent {
  id: string
  title: string
  description: string | null
  date: string
  startTime: string
  duration: number
}

export async function sendCancellationEmail({
  resend,
  from,
  to,
  name,
  event,
  location,
  eventUrl,
  reason,
  locale
}: {
  resend: Resend
  from: string
  to: string
  name: string | null
  event: CancellationEmailEvent
  location: string
  eventUrl: string
  reason: string
  locale: EmailLocale
}) {
  const i18n = createEmailI18n(locale)
  const title = event.title
  const greeting = name ? i18n._(msg`Hi ${name},`) : i18n._(msg`Hi,`)
  const when = `${event.date} ${event.startTime} (${event.duration} min)`
  const description = event.description?.trim()
  const heading = i18n._(msg`Event cancelled`)
  const cancelledText = i18n._(msg`was cancelled.`)
  const whenLabel = i18n._(msg`When`)
  const whereLabel = i18n._(msg`Where`)
  const reasonLabel = i18n._(msg`Reason`)
  const viewEventText = i18n._(msg`View event`)
  const plainText = [
    greeting,
    '',
    i18n._(msg`Your event was cancelled: ${title}`),
    i18n._(msg`When: ${when}`),
    i18n._(msg`Where: ${location}`),
    i18n._(msg`Reason: ${reason}`),
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
      <p><strong>${escapeHtml(event.title)}</strong> ${escapeHtml(cancelledText)}</p>
      <p><strong>${escapeHtml(whenLabel)}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${escapeHtml(whereLabel)}:</strong> ${escapeHtml(location)}</p>
      <p><strong>${escapeHtml(reasonLabel)}:</strong> ${escapeHtml(reason)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">${escapeHtml(viewEventText)}</a></p>
    </div>
  `

  const response = await resend.emails.send({
    from,
    to,
    subject: i18n._(msg`Event cancelled: ${title}`),
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

export function createEmailI18n(locale: EmailLocale): I18n {
  const i18n = setupI18n()
  i18n.loadAndActivate({
    locale,
    messages: locale === 'cs' ? csMessages : enMessages
  })
  return i18n
}
