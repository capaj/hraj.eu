import { getEmailCopy, formatEmailDate, type EmailLocale } from './localization'
import type { Resend } from 'resend'
import type { EventRow } from '../types'
import { encodeBase64, escapeHtml } from './utils'

export async function sendConfirmationEmail({
	locale = 'cs',
	resend,
	from,
	to,
	name,
	event,
	location,
	eventUrl,
	icalContent,
	icsFilename
}: {
	locale?: EmailLocale
	resend: Resend
	from: string
	to: string
	name: string | null
	event: EventRow
	location: string
	eventUrl: string
	icalContent: string
	icsFilename: string
}) {
	const copy = getEmailCopy(locale)
	const greeting = copy.greeting(name)
	const when = `${formatEmailDate(event.date, locale)} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		copy.confirmedIntro(event.title),
		`${copy.when}: ${when}`,
		`${copy.where}: ${location}`,
		description ? '' : null,
		description || null,
		'',
		copy.calendar,
		`${copy.viewEvent}: ${eventUrl}`
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${copy.confirmed}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${copy.confirmedSuffix}</p>
      <p><strong>${copy.when}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${copy.where}:</strong> ${escapeHtml(location)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p>${copy.calendar}</p>
      <p><a href="${eventUrl}">${copy.viewEvent}</a></p>
    </div>
  `

	const attachmentContent = encodeBase64(icalContent)
	const response = await resend.emails.send({
		from,
		to,
		subject: copy.confirmedSubject(event.title),
		html,
		text: plainText,
		attachments: [
			{
				filename: icsFilename,
				content: attachmentContent,
				contentType: 'text/calendar; charset=utf-8'
			}
		]
	})

	if (response.error) {
		throw new Error(
			`Resend API error (${response.error.statusCode ?? 'unknown'}): ${
				response.error.message
			}`
		)
	}
}
