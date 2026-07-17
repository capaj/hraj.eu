import { and, asc, eq, inArray, isNull, lt } from 'drizzle-orm'
import type { Resend } from 'resend'
import {
	eventCommentNotificationDeliveryT,
	eventCommentT,
	eventT,
	participantT,
	user
} from '../../web-app/drizzle/schema'
import {
	sendCommentDigestEmail,
	type CommentDigestItem
} from './email/sendCommentDigestEmail'

const COMMENT_BATCH_SIZE = 500
const DELIVERY_CLAIM_TIMEOUT_MS = 45 * 60 * 1000

type CronDb = {
	select: (...args: any[]) => any
	insert: (...args: any[]) => any
	update: (...args: any[]) => any
}

interface PendingComment {
	id: string
	eventId: string
	eventTitle: string
	authorUserId: string
	authorName: string | null
	content: string
	createdAt: Date
}

interface DigestRecipient {
	id: string
	email: string
	name: string | null
}

export async function sendPendingCommentDigests({
	database,
	resend,
	senderEmail,
	baseUrl,
	sendDigest = sendCommentDigestEmail
}: {
	database: CronDb
	resend: Resend
	senderEmail: string
	baseUrl: string
	sendDigest?: typeof sendCommentDigestEmail
}): Promise<void> {
	const pendingComments = (await database
		.select({
			id: eventCommentT.id,
			eventId: eventCommentT.eventId,
			eventTitle: eventT.title,
			authorUserId: eventCommentT.userId,
			authorName: user.name,
			content: eventCommentT.content,
			createdAt: eventCommentT.createdAt
		})
		.from(eventCommentT)
		.innerJoin(eventT, eq(eventT.id, eventCommentT.eventId))
		.innerJoin(user, eq(user.id, eventCommentT.userId))
		.where(isNull(eventCommentT.notifiedAt))
		.orderBy(asc(eventCommentT.createdAt), asc(eventCommentT.id))
		.limit(COMMENT_BATCH_SIZE)) as PendingComment[]

	console.log(`found ${pendingComments.length} event comments to notify`)

	const commentsByEvent = new Map<string, PendingComment[]>()
	for (const comment of pendingComments) {
		const eventComments = commentsByEvent.get(comment.eventId) ?? []
		eventComments.push(comment)
		commentsByEvent.set(comment.eventId, eventComments)
	}

	for (const [eventId, eventComments] of commentsByEvent) {
		await sendEventCommentDigests({
			database,
			resend,
			senderEmail,
			baseUrl,
			eventId,
			eventComments,
			sendDigest
		})
	}
}

async function sendEventCommentDigests({
	database,
	resend,
	senderEmail,
	baseUrl,
	eventId,
	eventComments,
	sendDigest
}: {
	database: CronDb
	resend: Resend
	senderEmail: string
	baseUrl: string
	eventId: string
	eventComments: PendingComment[]
	sendDigest: typeof sendCommentDigestEmail
}): Promise<void> {
	const recipients = (await database
		.select({
			id: user.id,
			email: user.email,
			name: user.name
		})
		.from(participantT)
		.innerJoin(user, eq(user.id, participantT.userId))
		.where(
			and(
				eq(participantT.eventId, eventId),
				eq(participantT.status, 'confirmed'),
				eq(user.emailNotificationsDisabled, false)
			)
		)) as DigestRecipient[]

	const commentIds = eventComments.map((comment) => comment.id)
	const existingDeliveries = (await database
		.select({
			commentId: eventCommentNotificationDeliveryT.commentId,
			recipientUserId: eventCommentNotificationDeliveryT.recipientUserId,
			deliveredAt: eventCommentNotificationDeliveryT.deliveredAt
		})
		.from(eventCommentNotificationDeliveryT)
		.where(
			inArray(eventCommentNotificationDeliveryT.commentId, commentIds)
		)) as Array<{
		commentId: string
		recipientUserId: string
		deliveredAt: Date | null
	}>

	const delivered = new Set(
		existingDeliveries
			.filter((delivery) => delivery.deliveredAt)
			.map((delivery) =>
				deliveryKey(delivery.commentId, delivery.recipientUserId)
			)
	)

	for (const recipient of recipients) {
		const pendingCommentsForRecipient = eventComments.filter(
			(comment) =>
				comment.authorUserId !== recipient.id &&
				!delivered.has(deliveryKey(comment.id, recipient.id))
		)

		if (!pendingCommentsForRecipient.length) {
			continue
		}

		try {
			const claimToken = crypto.randomUUID()
			const claimedAt = new Date()
			const pendingCommentIds = pendingCommentsForRecipient.map(
				(comment) => comment.id
			)

			await database
				.insert(eventCommentNotificationDeliveryT)
				.values(
					pendingCommentsForRecipient.map((comment) => ({
						commentId: comment.id,
						recipientUserId: recipient.id,
						claimToken,
						claimedAt
					}))
				)
				.onConflictDoNothing()

			await database
				.update(eventCommentNotificationDeliveryT)
				.set({ claimToken, claimedAt })
				.where(
					and(
						inArray(
							eventCommentNotificationDeliveryT.commentId,
							pendingCommentIds
						),
						eq(
							eventCommentNotificationDeliveryT.recipientUserId,
							recipient.id
						),
						isNull(eventCommentNotificationDeliveryT.deliveredAt),
						lt(
							eventCommentNotificationDeliveryT.claimedAt,
							new Date(Date.now() - DELIVERY_CLAIM_TIMEOUT_MS)
						)
					)
				)

			const claimedDeliveries = (await database
				.select({
					commentId: eventCommentNotificationDeliveryT.commentId
				})
				.from(eventCommentNotificationDeliveryT)
				.where(
					and(
						inArray(
							eventCommentNotificationDeliveryT.commentId,
							pendingCommentIds
						),
						eq(
							eventCommentNotificationDeliveryT.recipientUserId,
							recipient.id
						),
						eq(eventCommentNotificationDeliveryT.claimToken, claimToken),
						isNull(eventCommentNotificationDeliveryT.deliveredAt)
					)
				)) as Array<{ commentId: string }>
			const claimedCommentIds = new Set(
				claimedDeliveries.map((delivery) => delivery.commentId)
			)
			const commentsForRecipient = pendingCommentsForRecipient.filter(
				(comment) => claimedCommentIds.has(comment.id)
			)

			if (!commentsForRecipient.length) {
				continue
			}

			await sendDigest({
				resend,
				from: senderEmail,
				to: recipient.email,
				name: recipient.name,
				eventTitle: eventComments[0].eventTitle,
				eventUrl: `${baseUrl}/events/${eventId}`,
				comments: commentsForRecipient.map(toDigestItem),
				idempotencyKey: await createDigestIdempotencyKey(
					eventId,
					recipient.id,
					commentsForRecipient.map((comment) => comment.id)
				)
			})

			await database
				.update(eventCommentNotificationDeliveryT)
				.set({ deliveredAt: new Date() })
				.where(
					and(
						eq(eventCommentNotificationDeliveryT.claimToken, claimToken),
						eq(
							eventCommentNotificationDeliveryT.recipientUserId,
							recipient.id
						),
						inArray(
							eventCommentNotificationDeliveryT.commentId,
							commentsForRecipient.map((comment) => comment.id)
						),
						isNull(eventCommentNotificationDeliveryT.deliveredAt)
					)
				)

			for (const comment of commentsForRecipient) {
				delivered.add(deliveryKey(comment.id, recipient.id))
			}
		} catch (error) {
			console.error(
				`Failed to send comment digest for event ${eventId} to ${recipient.email}`,
				error
			)
		}
	}

	const completedCommentIds = eventComments
		.filter((comment) =>
			recipients
				.filter((recipient) => recipient.id !== comment.authorUserId)
				.every((recipient) =>
					delivered.has(deliveryKey(comment.id, recipient.id))
				)
		)
		.map((comment) => comment.id)

	if (completedCommentIds.length) {
		await database
			.update(eventCommentT)
			.set({ notifiedAt: new Date() })
			.where(inArray(eventCommentT.id, completedCommentIds))
	}
}

function toDigestItem(comment: PendingComment): CommentDigestItem {
	return {
		authorName: comment.authorName?.trim() || 'Someone',
		content: comment.content,
		createdAt: comment.createdAt
	}
}

function deliveryKey(commentId: string, recipientUserId: string): string {
	return `${commentId}:${recipientUserId}`
}

async function createDigestIdempotencyKey(
	eventId: string,
	recipientUserId: string,
	commentIds: string[]
): Promise<string> {
	const input = [eventId, recipientUserId, ...commentIds].join(':')
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(input)
	)
	const hash = Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('')
	return `comment-digest-${hash}`
}
