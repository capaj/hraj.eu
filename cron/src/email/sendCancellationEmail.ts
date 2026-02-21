import type { Resend } from 'resend'
import type { EventRow } from '../types'
import type { EmailLocale } from '../../../web-app/src/lib/notificationPreferences'
import { escapeHtml } from './utils'

const CANCELLATION_TEMPLATES = {
	en: {
		greeting: (name: string | null) => (name ? `Hi ${name},` : 'Hi,'),
		subject: (eventTitle: string) => `Event cancelled: ${eventTitle}`,
		heading: 'Event cancelled',
		cancelledSentence: 'was cancelled.',
		whenLabel: 'When',
		whereLabel: 'Where',
		reasonLabel: 'Reason',
		viewEvent: 'View event',
		textCancelled: (eventTitle: string) =>
			`Your event was cancelled: ${eventTitle}`,
		textWhen: (when: string) => `When: ${when}`,
		textWhere: (where: string) => `Where: ${where}`,
		textReason: (reason: string) => `Reason: ${reason}`,
		textViewEvent: (url: string) => `View event: ${url}`
	},
	cs: {
		greeting: (name: string | null) => (name ? `Ahoj ${name},` : 'Ahoj,'),
		subject: (eventTitle: string) => `Událost zrušena: ${eventTitle}`,
		heading: 'Událost zrušena',
		cancelledSentence: 'byla zrušena.',
		whenLabel: 'Kdy',
		whereLabel: 'Kde',
		reasonLabel: 'Důvod',
		viewEvent: 'Zobrazit událost',
		textCancelled: (eventTitle: string) =>
			`Tvoje událost byla zrušena: ${eventTitle}`,
		textWhen: (when: string) => `Kdy: ${when}`,
		textWhere: (where: string) => `Kde: ${where}`,
		textReason: (reason: string) => `Důvod: ${reason}`,
		textViewEvent: (url: string) => `Zobrazit událost: ${url}`
	}
} as const

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
	const template = CANCELLATION_TEMPLATES[locale]
	const greeting = template.greeting(name)
	const when = `${event.date} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		template.textCancelled(event.title),
		template.textWhen(when),
		template.textWhere(location),
		template.textReason(reason),
		description ? '' : null,
		description || null,
		'',
		template.textViewEvent(eventUrl)
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${template.heading}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${template.cancelledSentence}</p>
      <p><strong>${template.whenLabel}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${template.whereLabel}:</strong> ${escapeHtml(location)}</p>
      <p><strong>${template.reasonLabel}:</strong> ${escapeHtml(reason)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">${template.viewEvent}</a></p>
    </div>
  `

	const response = await resend.emails.send({
		from,
		to,
		subject: template.subject(event.title),
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
