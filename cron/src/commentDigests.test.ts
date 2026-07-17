import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { eq, isNull } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import * as schema from '../../web-app/drizzle/schema'
import {
	eventCommentNotificationDeliveryT,
	eventCommentT,
	eventT,
	participantT,
	user
} from '../../web-app/drizzle/schema'
import { sendPendingCommentDigests } from './commentDigests'

describe('sendPendingCommentDigests', () => {
	let tempDir: string
	let client: Client
	let database: ReturnType<typeof drizzle<typeof schema>>

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), 'hraj-comment-digests-'))
		client = createClient({ url: `file:${join(tempDir, 'test.db')}` })
		database = drizzle(client, { schema })
		await migrate(database, {
			migrationsFolder: resolve('../web-app/drizzle/migrations')
		})
	})

	afterEach(async () => {
		vi.restoreAllMocks()
		client.close()
		await rm(tempDir, { force: true, recursive: true })
	})

	it('sends event digests to confirmed participants and excludes their own comments', async () => {
		await seedEvent(database, {
			users: [
				{ id: 'author', email: 'author@example.com' },
				{ id: 'recipient', email: 'recipient@example.com' },
				{
					id: 'opted-out',
					email: 'opted-out@example.com',
					emailNotificationsDisabled: true
				}
			],
			comments: [
				{ id: 'comment-1', userId: 'author', content: 'First comment' },
				{ id: 'comment-2', userId: 'recipient', content: 'Second comment' }
			]
		})
		const sentDigests: Array<{
			to: string
			comments: Array<{ content: string }>
		}> = []

		await sendPendingCommentDigests({
			database,
			resend: {} as never,
			senderEmail: 'noreply@example.com',
			baseUrl: 'https://example.com',
			sendDigest: vi.fn(async ({ to, comments }) => {
				sentDigests.push({ to, comments })
			})
		})

		expect(sentDigests).toEqual([
			{
				to: 'author@example.com',
				comments: [expect.objectContaining({ content: 'Second comment' })]
			},
			{
				to: 'recipient@example.com',
				comments: [expect.objectContaining({ content: 'First comment' })]
			}
		])

		const comments = await database
			.select({
				id: eventCommentT.id,
				notifiedAt: eventCommentT.notifiedAt
			})
			.from(eventCommentT)
		expect(comments).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'comment-1', notifiedAt: expect.any(Date) }),
				expect.objectContaining({ id: 'comment-2', notifiedAt: expect.any(Date) })
			])
		)
	})

	it('retries only failed recipients on the next hourly run', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		await seedEvent(database, {
			users: [
				{ id: 'author', email: 'author@example.com' },
				{ id: 'recipient-1', email: 'recipient-1@example.com' },
				{ id: 'recipient-2', email: 'recipient-2@example.com' }
			],
			comments: [
				{ id: 'comment-1', userId: 'author', content: 'Needs a retry' }
			]
		})

		await sendPendingCommentDigests({
			database,
			resend: {} as never,
			senderEmail: 'noreply@example.com',
			baseUrl: 'https://example.com',
			sendDigest: vi.fn(async ({ to }) => {
				if (to === 'recipient-2@example.com') {
					throw new Error('Temporary email failure')
				}
			})
		})

		const [pendingComment] = await database
			.select({ notifiedAt: eventCommentT.notifiedAt })
			.from(eventCommentT)
			.where(eq(eventCommentT.id, 'comment-1'))
		expect(pendingComment.notifiedAt).toBeNull()
		await database
			.update(eventCommentNotificationDeliveryT)
			.set({ claimedAt: new Date(Date.now() - 60 * 60 * 1000) })
			.where(isNull(eventCommentNotificationDeliveryT.deliveredAt))

		const retriedRecipients: string[] = []
		await sendPendingCommentDigests({
			database,
			resend: {} as never,
			senderEmail: 'noreply@example.com',
			baseUrl: 'https://example.com',
			sendDigest: vi.fn(async ({ to }) => {
				retriedRecipients.push(to)
			})
		})

		expect(retriedRecipients).toEqual(['recipient-2@example.com'])
		const deliveries = await database
			.select({
				recipientUserId:
					eventCommentNotificationDeliveryT.recipientUserId
			})
			.from(eventCommentNotificationDeliveryT)
		expect(deliveries).toEqual(
			expect.arrayContaining([
				{ recipientUserId: 'recipient-1' },
				{ recipientUserId: 'recipient-2' }
			])
		)

		const [completedComment] = await database
			.select({ notifiedAt: eventCommentT.notifiedAt })
			.from(eventCommentT)
			.where(eq(eventCommentT.id, 'comment-1'))
		expect(completedComment.notifiedAt).toEqual(expect.any(Date))
	})

	it('claims deliveries before sending so overlapping runs do not duplicate comments', async () => {
		await seedEvent(database, {
			users: [
				{ id: 'author', email: 'author@example.com' },
				{ id: 'recipient', email: 'recipient@example.com' }
			],
			comments: [
				{ id: 'comment-1', userId: 'author', content: 'First comment' }
			]
		})

		let releaseFirstSend: (() => void) | undefined
		let markFirstSendStarted: (() => void) | undefined
		const firstSendStarted = new Promise<void>((resolve) => {
			markFirstSendStarted = resolve
		})
		const firstRunComments: string[] = []
		const firstRun = sendPendingCommentDigests({
			database,
			resend: {} as never,
			senderEmail: 'noreply@example.com',
			baseUrl: 'https://example.com',
			sendDigest: vi.fn(async ({ comments }) => {
				firstRunComments.push(...comments.map((comment) => comment.content))
				markFirstSendStarted?.()
				await new Promise<void>((resolve) => {
					releaseFirstSend = resolve
				})
			})
		})

		await firstSendStarted
		await database.insert(eventCommentT).values({
			id: 'comment-2',
			eventId: 'event-1',
			userId: 'author',
			content: 'Second comment'
		})

		const secondRunComments: string[] = []
		await sendPendingCommentDigests({
			database,
			resend: {} as never,
			senderEmail: 'noreply@example.com',
			baseUrl: 'https://example.com',
			sendDigest: vi.fn(async ({ comments }) => {
				secondRunComments.push(...comments.map((comment) => comment.content))
			})
		})

		expect(firstRunComments).toEqual(['First comment'])
		expect(secondRunComments).toEqual(['Second comment'])

		releaseFirstSend?.()
		await firstRun
	})

	it('completes comments when nobody is eligible for an email', async () => {
		await seedEvent(database, {
			users: [
				{ id: 'author', email: 'author@example.com' },
				{
					id: 'opted-out',
					email: 'opted-out@example.com',
					emailNotificationsDisabled: true
				}
			],
			comments: [
				{ id: 'comment-1', userId: 'author', content: 'No recipients' }
			]
		})
		const sendDigest = vi.fn()

		await sendPendingCommentDigests({
			database,
			resend: {} as never,
			senderEmail: 'noreply@example.com',
			baseUrl: 'https://example.com',
			sendDigest
		})

		expect(sendDigest).not.toHaveBeenCalled()
		const [comment] = await database
			.select({ notifiedAt: eventCommentT.notifiedAt })
			.from(eventCommentT)
			.where(eq(eventCommentT.id, 'comment-1'))
		expect(comment.notifiedAt).toEqual(expect.any(Date))
	})
})

async function seedEvent(
	database: ReturnType<typeof drizzle<typeof schema>>,
	{
		users,
		comments
	}: {
		users: Array<{
			id: string
			email: string
			emailNotificationsDisabled?: boolean
		}>
		comments: Array<{ id: string; userId: string; content: string }>
	}
): Promise<void> {
	await database.insert(user).values(
		users.map((seedUser) => ({
			id: seedUser.id,
			name: seedUser.id,
			email: seedUser.email,
			emailVerified: true,
			emailNotificationsDisabled:
				seedUser.emailNotificationsDisabled ?? false
		}))
	)
	await database.insert(eventT).values({
		id: 'event-1',
		title: 'Past match discussion',
		sport: 'football',
		date: '2020-01-01',
		startTime: '18:00',
		duration: 90,
		minParticipants: 1,
		maxParticipants: 10,
		cancellationDeadlineMinutes: 60,
		organizerId: users[0].id,
		seriesId: 'event-1'
	})
	await database.insert(participantT).values(
		users.map((seedUser, index) => ({
			id: index + 1,
			eventId: 'event-1',
			userId: seedUser.id,
			status: 'confirmed' as const,
			confirmedParticipantOrdinal: index + 1
		}))
	)
	await database.insert(eventCommentT).values(
		comments.map((comment) => ({
			id: comment.id,
			eventId: 'event-1',
			userId: comment.userId,
			content: comment.content
		}))
	)
}
