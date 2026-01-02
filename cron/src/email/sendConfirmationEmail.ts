import type { Resend } from 'resend'
import type { EventRow } from '../types'
import { encodeBase64, escapeHtml } from './utils'

export async function sendConfirmationEmail({
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
	const greeting = name ? `Hi ${name},` : 'Hi,'
	const when = `${event.date} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		`Your event is confirmed: ${event.title}`,
		`When: ${when}`,
		`Where: ${location}`,
		description ? '' : null,
		description || null,
		'',
		'We attached a calendar file so you can add it to Google Calendar.',
		`View event: ${eventUrl}`
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>Event confirmed</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> is confirmed.</p>
      <p><strong>When:</strong> ${escapeHtml(when)}</p>
      <p><strong>Where:</strong> ${escapeHtml(location)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p>We attached a calendar file so you can add it to Google Calendar.</p>
      <p><a href="${eventUrl}">View event</a></p>
    </div>
  `

	const attachmentContent = encodeBase64(icalContent)
	const response = await resend.emails.send({
		from,
		to,
		subject: `Event confirmed: ${event.title}`,
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
