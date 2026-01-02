import type { Resend } from 'resend'
import type { EventRow } from '../types'
import { escapeHtml } from './utils'

export async function sendCancellationEmail({
	resend,
	from,
	to,
	name,
	event,
	location,
	eventUrl,
	reason
}: {
	resend: Resend
	from: string
	to: string
	name: string | null
	event: EventRow
	location: string
	eventUrl: string
	reason: string
}) {
	const greeting = name ? `Hi ${name},` : 'Hi,'
	const when = `${event.date} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		`Your event was cancelled: ${event.title}`,
		`When: ${when}`,
		`Where: ${location}`,
		`Reason: ${reason}`,
		description ? '' : null,
		description || null,
		'',
		`View event: ${eventUrl}`
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>Event cancelled</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> was cancelled.</p>
      <p><strong>When:</strong> ${escapeHtml(when)}</p>
      <p><strong>Where:</strong> ${escapeHtml(location)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">View event</a></p>
    </div>
  `

	const response = await resend.emails.send({
		from,
		to,
		subject: `Event cancelled: ${event.title}`,
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
