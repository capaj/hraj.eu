import { getEmailCopy, formatEmailDate, type EmailLocale } from './localization'
import type { Resend } from 'resend'
import type { EventRow } from '../types'
import { escapeHtml } from './utils'

export async function sendCancellationEmail({
	locale = 'cs',
	resend,
	from,
	to,
	name,
	event,
	location,
	eventUrl,
	reason
}: {
	locale?: EmailLocale
	resend: Resend
	from: string
	to: string
	name: string | null
	event: EventRow
	location: string
	eventUrl: string
	reason: string
}) {
	const copy = getEmailCopy(locale)
	const greeting = copy.greeting(name)
	const cancellationReason = reason === 'Minimum participants not reached' ? copy.minimumParticipants : reason
	const when = `${formatEmailDate(event.date, locale)} ${event.startTime} (${event.duration} min)`
	const description = event.description?.trim()
	const plainText = [
		greeting,
		'',
		copy.cancelledIntro(event.title),
		`${copy.when}: ${when}`,
		`${copy.where}: ${location}`,
		`${copy.reason}: ${cancellationReason}`,
		description ? '' : null,
		description || null,
		'',
		`${copy.viewEvent}: ${eventUrl}`
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2>${copy.cancelled}</h2>
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(event.title)}</strong> ${copy.cancelledSuffix}</p>
      <p><strong>${copy.when}:</strong> ${escapeHtml(when)}</p>
      <p><strong>${copy.where}:</strong> ${escapeHtml(location)}</p>
      <p><strong>${copy.reason}:</strong> ${escapeHtml(cancellationReason)}</p>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="${eventUrl}">${copy.viewEvent}</a></p>
    </div>
  `

	const response = await resend.emails.send({
		from,
		to,
		subject: copy.cancelledSubject(event.title),
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
