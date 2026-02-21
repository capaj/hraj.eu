import type { Resend } from 'resend'
import type { EventRow } from '../types'
import type { EmailLocale } from '../../../web-app/src/lib/notificationPreferences'
import { escapeHtml } from './utils'

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
	event: EventRow
	location: string
	eventUrl: string
	reason: string
	locale: EmailLocale
}) {
	const isCzech = locale === 'cs'
	const greeting = name
		? isCzech
			? `Ahoj ${name},`
			: `Hi ${name},`
		: isCzech
			? 'Ahoj,'
			: 'Hi,'
	const when = `${event.date} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		isCzech
			? `Tvoje událost byla zrušena: ${event.title}`
			: `Your event was cancelled: ${event.title}`,
		isCzech ? `Kdy: ${when}` : `When: ${when}`,
		isCzech ? `Kde: ${location}` : `Where: ${location}`,
		isCzech ? `Důvod: ${reason}` : `Reason: ${reason}`,
		description ? '' : null,
		description || null,
		'',
		isCzech ? `Zobrazit událost: ${eventUrl}` : `View event: ${eventUrl}`
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${isCzech ? 'Událost zrušena' : 'Event cancelled'}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${isCzech ? 'byla zrušena.' : 'was cancelled.'}</p>
      <p><strong>${isCzech ? 'Kdy' : 'When'}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${isCzech ? 'Kde' : 'Where'}:</strong> ${escapeHtml(location)}</p>
      <p><strong>${isCzech ? 'Důvod' : 'Reason'}:</strong> ${escapeHtml(reason)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">${isCzech ? 'Zobrazit událost' : 'View event'}</a></p>
    </div>
  `

	const response = await resend.emails.send({
		from,
		to,
		subject: isCzech
			? `Událost zrušena: ${event.title}`
			: `Event cancelled: ${event.title}`,
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
