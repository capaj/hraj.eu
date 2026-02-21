import type { Resend } from 'resend'
import type { EventRow } from '../types'
import type { EmailLocale } from '../../../web-app/src/lib/notificationPreferences'
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
	icsFilename,
	locale
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
			? `Tvá událost je potvrzena: ${event.title}`
			: `Your event is confirmed: ${event.title}`,
		isCzech ? `Kdy: ${when}` : `When: ${when}`,
		isCzech ? `Kde: ${location}` : `Where: ${location}`,
		description ? '' : null,
		description || null,
		'',
		isCzech
			? 'Přiložili jsme soubor kalendáře, který si můžeš přidat do Google Kalendáře.'
			: 'We attached a calendar file so you can add it to Google Calendar.',
		isCzech ? `Zobrazit událost: ${eventUrl}` : `View event: ${eventUrl}`
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${isCzech ? 'Událost potvrzena' : 'Event confirmed'}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${isCzech ? 'je potvrzena.' : 'is confirmed.'}</p>
      <p><strong>${isCzech ? 'Kdy' : 'When'}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${isCzech ? 'Kde' : 'Where'}:</strong> ${escapeHtml(location)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p>${
				isCzech
					? 'Přiložili jsme soubor kalendáře, který si můžeš přidat do Google Kalendáře.'
					: 'We attached a calendar file so you can add it to Google Calendar.'
			}</p>
      <p><a href="${eventUrl}">${isCzech ? 'Zobrazit událost' : 'View event'}</a></p>
    </div>
  `

	const attachmentContent = encodeBase64(icalContent)
	const response = await resend.emails.send({
		from,
		to,
		subject: isCzech
			? `Událost potvrzena: ${event.title}`
			: `Event confirmed: ${event.title}`,
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
