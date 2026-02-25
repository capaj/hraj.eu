import type { Resend } from 'resend'
import type { EventRow } from '../types'
import type { EmailLocale } from '../../../web-app/src/lib/notificationPreferences'
import { encodeBase64, escapeHtml } from './utils'

const CONFIRMATION_TEMPLATES = {
	en: {
		greeting: (name: string | null) => (name ? `Hi ${name},` : 'Hi,'),
		subject: (eventTitle: string) => `Event confirmed: ${eventTitle}`,
		heading: 'Event confirmed',
		confirmedSentence: 'is confirmed.',
		whenLabel: 'When',
		whereLabel: 'Where',
		calendarLine:
			'We attached a calendar file so you can add it to Google Calendar.',
		viewEvent: 'View event',
		textConfirmed: (eventTitle: string) => `Your event is confirmed: ${eventTitle}`,
		textWhen: (when: string) => `When: ${when}`,
		textWhere: (where: string) => `Where: ${where}`,
		textViewEvent: (url: string) => `View event: ${url}`
	},
	cs: {
		greeting: (name: string | null) => (name ? `Ahoj ${name},` : 'Ahoj,'),
		subject: (eventTitle: string) => `Událost potvrzena: ${eventTitle}`,
		heading: 'Událost potvrzena',
		confirmedSentence: 'je potvrzena.',
		whenLabel: 'Kdy',
		whereLabel: 'Kde',
		calendarLine:
			'Přiložili jsme soubor kalendáře, který si můžeš přidat do Google Kalendáře.',
		viewEvent: 'Zobrazit událost',
		textConfirmed: (eventTitle: string) => `Tvá událost je potvrzena: ${eventTitle}`,
		textWhen: (when: string) => `Kdy: ${when}`,
		textWhere: (where: string) => `Kde: ${where}`,
		textViewEvent: (url: string) => `Zobrazit událost: ${url}`
	}
} as const

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
	const template = CONFIRMATION_TEMPLATES[locale]
	const greeting = template.greeting(name)
	const when = `${event.date} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		template.textConfirmed(event.title),
		template.textWhen(when),
		template.textWhere(location),
		description ? '' : null,
		description || null,
		'',
		template.calendarLine,
		template.textViewEvent(eventUrl)
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${template.heading}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${template.confirmedSentence}</p>
      <p><strong>${template.whenLabel}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${template.whereLabel}:</strong> ${escapeHtml(location)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p>${template.calendarLine}</p>
      <p><a href="${eventUrl}">${template.viewEvent}</a></p>
    </div>
  `

	const attachmentContent = encodeBase64(icalContent)
	const response = await resend.emails.send({
		from,
		to,
		subject: template.subject(event.title),
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
