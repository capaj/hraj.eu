import { getEmailCopy, type EmailLocale } from './localization'
import type { Resend } from 'resend'
import { escapeHtml } from './utils'

export interface CommentDigestItem {
	authorName: string
	content: string
	createdAt: Date
}

const MAX_COMMENT_PREVIEWS = 10

export async function sendCommentDigestEmail({
	locale = 'cs',
	resend,
	from,
	to,
	name,
	eventTitle,
	eventUrl,
	comments,
	idempotencyKey
}: {
	locale?: EmailLocale
	resend: Resend
	from: string
	to: string
	name: string | null
	eventTitle: string
	eventUrl: string
	comments: CommentDigestItem[]
	idempotencyKey: string
}): Promise<void> {
	const copy = getEmailCopy(locale)
	const greeting = copy.greeting(name)
	const previewComments = comments.slice(0, MAX_COMMENT_PREVIEWS)
	const additionalCommentCount = comments.length - previewComments.length
	const escapedEventUrl = escapeHtml(eventUrl)

	const plainText = [
		greeting,
		'',
		`${copy.commentsSubject(comments.length, eventTitle)}:`,
		'',
		...previewComments.map(
			(comment) =>
				`${comment.authorName} (${comment.createdAt.toISOString()}):\n${comment.content}`
		),
		additionalCommentCount > 0
			? copy.moreComments(additionalCommentCount)
			: null,
		'',
		`${copy.openDiscussion}: ${eventUrl}`,
		copy.unsubscribe
	]
		.filter((line): line is string => Boolean(line))
		.join('\n\n')

	const commentsHtml = previewComments
		.map((comment) => {
			const createdAt = comment.createdAt.toLocaleString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'Europe/Prague'
			})

			return `
				<div style="margin: 0 0 14px; padding: 12px; border: 1px solid #e6e6e6; border-radius: 8px; background: #fafafa;">
					<div style="font-size: 12px; color: #666; margin-bottom: 8px;">
						<strong>${escapeHtml(comment.authorName)}</strong> · ${escapeHtml(createdAt)}
					</div>
					<div style="font-size: 14px; color: #222; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(comment.content)}</div>
				</div>
			`
		})
		.join('')

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
			<h2>${escapeHtml(copy.commentsHeading(eventTitle))}</h2>
			<p>${escapeHtml(greeting)}</p>
			<p>${copy.commentsIntro(comments.length)}</p>
			${commentsHtml}
			${
				additionalCommentCount > 0
					? `<p style="color: #666;">${copy.moreComments(additionalCommentCount)}</p>`
					: ''
			}
			<p><a href="${escapedEventUrl}">${copy.openDiscussion}</a></p>
			<p style="color: #666; font-size: 12px;">${copy.unsubscribe}</p>
		</div>
	`

	const response = await resend.emails.send(
		{
			from,
			to,
			subject: copy.commentsSubject(comments.length, eventTitle),
			html,
			text: plainText
		},
		{ idempotencyKey }
	)

	if (response.error) {
		throw new Error(
			`Resend API error (${response.error.statusCode ?? 'unknown'}): ${
				response.error.message ?? 'No message provided'
			}`
		)
	}
}
