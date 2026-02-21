import type { Resend } from 'resend'
import { escapeHtml } from './utils'
import type { EmailLocale } from '../../../web-app/src/lib/notificationPreferences'

interface CommentDigestItem {
	authorName: string
	content: string
	createdAt: Date
}

const COMMENT_DIGEST_TEMPLATES = {
	en: {
		greeting: (name: string | null) => (name ? `Hi ${name},` : 'Hi,'),
		subject: (count: number, eventTitle: string) =>
			`${count} new ${count === 1 ? 'comment' : 'comments'} on ${eventTitle}`,
		headingPrefix: 'New comments on',
		intro: (count: number, eventTitle: string) =>
			`There are <strong>${count}</strong> new ${
				count === 1 ? 'comment' : 'comments'
			} on <strong>${escapeHtml(eventTitle)}</strong>.`,
		extra: (count: number) =>
			`+ ${count} more new ${count === 1 ? 'comment' : 'comments'} in this digest.`,
		openDiscussion: 'Open event discussion',
		optOutLine:
			'You can opt out of all email notifications from your profile settings.',
		plainIntro: (count: number, eventTitle: string) =>
			`There are ${count} new ${count === 1 ? 'comment' : 'comments'} on ${eventTitle}.`,
		plainMore: (count: number) =>
			`... and ${count} more comments.`,
		plainOpen: (eventUrl: string) => `View event discussion: ${eventUrl}`,
		dateLocale: 'en-GB'
	},
	cs: {
		greeting: (name: string | null) => (name ? `Ahoj ${name},` : 'Ahoj,'),
		subject: (count: number, eventTitle: string) =>
			`${count} nové ${count === 1 ? 'komentář' : 'komentáře'} u ${eventTitle}`,
		headingPrefix: 'Nové komentáře u události',
		intro: (count: number, eventTitle: string) =>
			`U události <strong>${escapeHtml(eventTitle)}</strong> přibyly <strong>${count}</strong> nové ${
				count === 1 ? 'komentář' : 'komentáře'
			}.`,
		extra: (count: number) =>
			`+ dalších ${count} ${count === 1 ? 'komentář' : 'komentářů'} v tomto souhrnu.`,
		openDiscussion: 'Otevřít diskuzi události',
		optOutLine:
			'V nastavení profilu se můžeš odhlásit ze všech e-mailových notifikací.',
		plainIntro: (count: number, eventTitle: string) =>
			`K události ${eventTitle} přibyly ${count} nové ${
				count === 1 ? 'komentář' : 'komentáře'
			}.`,
		plainMore: (count: number) => `... a dalších ${count} komentářů.`,
		plainOpen: (eventUrl: string) => `Zobrazit diskuzi události: ${eventUrl}`,
		dateLocale: 'cs-CZ'
	}
} as const

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
	const template = COMMENT_DIGEST_TEMPLATES[locale]
	const greeting = template.greeting(name)
	const previewComments = comments.slice(0, 5)
	const plainText = [
		greeting,
		'',
		template.plainIntro(comments.length, eventTitle),
		'',
		...previewComments.map(
			(comment, index) =>
				`${index + 1}. ${comment.authorName} (${comment.createdAt.toISOString()} UTC): ${comment.content}`
		),
		comments.length > previewComments.length
			? template.plainMore(comments.length - previewComments.length)
			: null,
		'',
		template.plainOpen(eventUrl),
		template.optOutLine
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

	const commentsHtml = previewComments
		.map((comment) => {
			const createdAt = comment.createdAt.toLocaleString(template.dateLocale, {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'UTC'
			})
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
			<h2>${template.headingPrefix} ${escapeHtml(eventTitle)}</h2>
			<p>${escapeHtml(greeting)}</p>
			<p>${template.intro(comments.length, eventTitle)}</p>
			${commentsHtml}
			${
				extraCount > 0
					? `<p style="color: #666;">${template.extra(extraCount)}</p>`
					: ''
			}
			<p><a href="${eventUrl}">${template.openDiscussion}</a></p>
			<p style="margin: 0; color: #666; font-size: 12px;">${template.optOutLine}</p>
		</div>
	`

	const response = await resend.emails.send({
		from,
		to,
		subject: template.subject(comments.length, eventTitle),
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
