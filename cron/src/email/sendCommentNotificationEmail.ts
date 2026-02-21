import type { Resend } from 'resend'
import { escapeHtml } from './utils'
import type { EmailLocale } from '../../../web-app/src/lib/notificationPreferences'

interface CommentDigestItem {
	authorName: string
	content: string
	createdAt: Date
}

export async function sendCommentNotificationEmail({
	resend,
	from,
	to,
	name,
	eventTitle,
	eventUrl,
	comments,
	locale
}: {
	resend: Resend
	from: string
	to: string
	name: string | null
	eventTitle: string
	eventUrl: string
	comments: CommentDigestItem[]
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
	const commentWord = comments.length === 1
		? isCzech
			? 'komentář'
			: 'comment'
		: isCzech
			? 'komentáře'
			: 'comments'
	const subject = isCzech
		? `${comments.length} nové ${commentWord} u ${eventTitle}`
		: `${comments.length} new ${commentWord} on ${eventTitle}`
	const previewComments = comments.slice(0, 5)
	const plainText = [
		greeting,
		'',
		isCzech
			? `K události ${eventTitle} přibyly ${comments.length} nové ${commentWord}.`
			: `There are ${comments.length} new ${commentWord} on ${eventTitle}.`,
		'',
		...previewComments.map(
			(comment, index) =>
				`${index + 1}. ${comment.authorName} (${comment.createdAt.toISOString()} UTC): ${comment.content}`
		),
		comments.length > previewComments.length
			? isCzech
				? `... a dalších ${comments.length - previewComments.length} komentářů.`
				: `... and ${comments.length - previewComments.length} more comments.`
			: null,
		'',
		isCzech
			? `Zobrazit diskuzi události: ${eventUrl}`
			: `View event discussion: ${eventUrl}`,
		isCzech
			? 'V nastavení profilu se můžeš odhlásit ze všech e-mailových notifikací.'
			: 'You can opt out of all email notifications from your profile settings.'
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const commentsHtml = previewComments
		.map((comment) => {
			const createdAt = comment.createdAt.toLocaleString(
				isCzech ? 'cs-CZ' : 'en-GB',
				{
					dateStyle: 'medium',
					timeStyle: 'short',
					timeZone: 'UTC'
				}
			)
			return `
				<div style="margin: 0 0 14px; padding: 12px; border: 1px solid #e6e6e6; border-radius: 8px; background: #fafafa;">
					<div style="font-size: 12px; color: #666; margin-bottom: 8px;">
						<strong>${escapeHtml(comment.authorName)}</strong> · ${escapeHtml(createdAt)} UTC
					</div>
					<div style="font-size: 14px; color: #222; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(comment.content)}</div>
				</div>
			`
		})
		.join('')
	const extraCount = comments.length - previewComments.length

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
			<h2>${isCzech ? 'Nové komentáře u události' : 'New comments on'} ${escapeHtml(eventTitle)}</h2>
			<p>${escapeHtml(greeting)}</p>
			<p>${
				isCzech
					? `U události <strong>${escapeHtml(eventTitle)}</strong> přibyly <strong>${comments.length}</strong> nové ${commentWord}.`
					: `There are <strong>${comments.length}</strong> new ${commentWord} on <strong>${escapeHtml(eventTitle)}</strong>.`
			}</p>
			${commentsHtml}
			${
				extraCount > 0
					? `<p style="color: #666;">${
							isCzech
								? `+ dalších ${extraCount} ${extraCount === 1 ? 'komentář' : 'komentářů'} v tomto souhrnu.`
								: `+ ${extraCount} more new ${extraCount === 1 ? 'comment' : 'comments'} in this digest.`
						}</p>`
					: ''
			}
			<p><a href="${eventUrl}">${isCzech ? 'Otevřít diskuzi události' : 'Open event discussion'}</a></p>
			<p style="margin: 0; color: #666; font-size: 12px;">${
				isCzech
					? 'V nastavení profilu se můžeš odhlásit ze všech e-mailových notifikací.'
					: 'You can opt out of all email notifications from your profile settings.'
			}</p>
		</div>
	`

	const response = await resend.emails.send({
		from,
		to,
		subject,
		html,
		text: plainText
	})

	if (response.error) {
		throw new Error(
			`Resend API error (${response.error.statusCode ?? 'unknown'}): ${
				response.error.message ?? 'No message provided'
			}`
		)
	}
}
