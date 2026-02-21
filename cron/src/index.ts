import { Resend } from 'resend'
import { and, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '../../web-app/drizzle/db'
import {
	eventCommentT,
	eventT,
	participantT,
	user,
	venueT
} from '../../web-app/drizzle/schema'
import { sendCancellationEmail } from './email/sendCancellationEmail'
import { sendCommentNotificationEmail } from './email/sendCommentNotificationEmail'
import { sendConfirmationEmail } from './email/sendConfirmationEmail'
import type { Env, EventRow, ParticipantRow } from './types'
import { areEmailNotificationsEnabled, normalizeEmailLocale } from '../../web-app/src/lib/notificationPreferences'

const LOCATION_FALLBACK = 'Location TBD'
const DEFAULT_BASE_URL = 'https://hraj.eu'
const CANCELLATION_REASON = 'Minimum participants not reached'

export default {
	async fetch(req) {
		const url = new URL(req.url)
		url.pathname = '/__scheduled'
		url.searchParams.append('cron', '0 * * * *')
		return new Response(
			`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`
		)
	},

	async scheduled(event, env, _ctx): Promise<void> {
		const resend = new Resend(requireEnv(env, 'RESEND_API_KEY'))
		const senderEmail = requireEnv(env, 'SENDER_EMAIL')
		const today = new Date().toISOString().split('T')[0]
		const baseUrl = (env.APP_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
		const confirmedCount = sql<number>`COUNT(${participantT.id})`.as('confirmed_count')
		const confirmedCounts = db
			.select({
				eventId: participantT.eventId,
				confirmedCount
			})
			.from(participantT)
			.where(eq(participantT.status, 'confirmed'))
			.groupBy(participantT.eventId)
			.as('confirmed_counts')
		const confirmedCountOrZero = sql<number>`COALESCE(${confirmedCounts.confirmedCount}, 0)`

		const eventSelection = {
			id: eventT.id,
			title: eventT.title,
			description: eventT.description,
			sport: eventT.sport,
			date: eventT.date,
			startTime: eventT.startTime,
			duration: eventT.duration,
			minParticipants: eventT.minParticipants,
			idealParticipants: eventT.idealParticipants,
			maxParticipants: eventT.maxParticipants,
			price: eventT.price,
			currency: eventT.currency,
			paymentDetails: eventT.paymentDetails,
			gameRules: eventT.gameRules,
			venueName: venueT.name,
			venueAddress: venueT.address,
			confirmedCount: confirmedCountOrZero
		}

		const eventsToConfirm = (await db
			.select(eventSelection)
			.from(eventT)
			.leftJoin(venueT, eq(venueT.id, eventT.venueId))
			.leftJoin(confirmedCounts, eq(confirmedCounts.eventId, eventT.id))
			.where(
				and(
					eq(eventT.status, 'open'),
					isNull(eventT.confirmedAt),
					gte(eventT.date, today),
					sql`${confirmedCountOrZero} >= ${eventT.minParticipants}`
				)
			)) as EventRow[]

		console.log(`found ${eventsToConfirm.length} events to confirm`)
		if (!eventsToConfirm.length) {
			console.log(`trigger fired at ${event.cron}: no events to confirm`)
		}

		for (const eventRow of eventsToConfirm) {
			const updated = await db
				.update(eventT)
				.set({ status: 'confirmed', confirmedAt: new Date() })
				.where(
					and(
						eq(eventT.id, eventRow.id),
						eq(eventT.status, 'open'),
						isNull(eventT.confirmedAt)
					)
				)
				.returning({ id: eventT.id })

			if (!updated.length) {
				continue
			}

			const participants = await getConfirmedParticipants(eventRow.id)
			const location = formatLocation(eventRow.venueName, eventRow.venueAddress)
			const calendarEvent = toCalendarEvent(eventRow, location)
			const icalContent = generateICalEvent(calendarEvent)
			const icsFilename = `${slugify(eventRow.title || 'event')}.ics`
			const eventUrl = `${baseUrl}/events/${eventRow.id}`
			const emailEligibleParticipants = participants.filter(canReceiveEmails)

			for (const attendee of emailEligibleParticipants) {
				if (!attendee.email) {
					continue
				}

				try {
					await sendConfirmationEmail({
						resend,
						from: senderEmail,
						to: attendee.email,
						name: attendee.name,
						event: eventRow,
						location,
						eventUrl,
						icalContent,
						icsFilename,
					locale: normalizeEmailLocale(attendee.preferredLanguage)
					})
				} catch (error) {
					console.error(
						`Failed to send confirmation email for event ${eventRow.id} to ${attendee.email}`,
						error
					)
				}
			}

			console.log(
				`Confirmed event ${eventRow.id} and emailed ${emailEligibleParticipants.length}/${participants.length} attendees`
			)
		}

		const cancellationDeadlineReached = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime}, '-' || ${eventT.cancellationDeadlineMinutes} || ' minutes') <= datetime('now')`

		const eventsToCancel = (await db
			.select(eventSelection)
			.from(eventT)
			.leftJoin(venueT, eq(venueT.id, eventT.venueId))
			.leftJoin(confirmedCounts, eq(confirmedCounts.eventId, eventT.id))
			.where(
				and(
					eq(eventT.status, 'open'),
					isNull(eventT.cancellationCheckRanAt),
					gte(eventT.date, today),
					cancellationDeadlineReached,
					sql`${confirmedCountOrZero} < ${eventT.minParticipants}`
				)
			)) as EventRow[]

		console.log(`found ${eventsToCancel.length} events to cancel`)
		for (const eventRow of eventsToCancel) {
			const updated = await db
				.update(eventT)
				.set({
					status: 'cancelled',
					cancellationReason: CANCELLATION_REASON,
					cancellationCheckRanAt: new Date()
				})
				.where(
					and(
						eq(eventT.id, eventRow.id),
						eq(eventT.status, 'open'),
						isNull(eventT.cancellationCheckRanAt)
					)
				)
				.returning({ id: eventT.id })

			if (!updated.length) {
				continue
			}

			const participants = await getConfirmedParticipants(eventRow.id)
			const location = formatLocation(eventRow.venueName, eventRow.venueAddress)
			const eventUrl = `${baseUrl}/events/${eventRow.id}`
			const emailEligibleParticipants = participants.filter(canReceiveEmails)

			for (const attendee of emailEligibleParticipants) {
				if (!attendee.email) {
					continue
				}

				try {
					await sendCancellationEmail({
						resend,
						from: senderEmail,
						to: attendee.email,
						name: attendee.name,
						event: eventRow,
						location,
						eventUrl,
						reason: getCancellationReason(normalizeEmailLocale(attendee.preferredLanguage)),
					locale: normalizeEmailLocale(attendee.preferredLanguage)
					})
				} catch (error) {
					console.error(
						`Failed to send cancellation email for event ${eventRow.id} to ${attendee.email}`,
						error
					)
				}
			}

			console.log(
				`Cancelled event ${eventRow.id} and emailed ${emailEligibleParticipants.length}/${participants.length} attendees`
			)
		}

		const commentsToNotify = await db
			.select({
				id: eventCommentT.id,
				eventId: eventCommentT.eventId,
				userId: eventCommentT.userId,
				content: eventCommentT.content,
				createdAt: eventCommentT.createdAt,
				eventTitle: eventT.title,
				authorName: user.name
			})
			.from(eventCommentT)
			.innerJoin(eventT, eq(eventT.id, eventCommentT.eventId))
			.innerJoin(user, eq(user.id, eventCommentT.userId))
			.where(and(isNull(eventCommentT.notifiedAt), gte(eventT.date, today)))
			.orderBy(eventCommentT.createdAt)

		console.log(`found ${commentsToNotify.length} event comments to notify`)
		if (commentsToNotify.length) {
			const commentsByEvent = new Map<string, typeof commentsToNotify>()
			for (const comment of commentsToNotify) {
				const current = commentsByEvent.get(comment.eventId) ?? []
				current.push(comment)
				commentsByEvent.set(comment.eventId, current)
			}

			const sentCommentIds = new Set<string>()

			for (const [eventId, eventComments] of commentsByEvent) {
				const participants = await getConfirmedParticipants(eventId)
				const receiversById = new Map(
					participants
						.filter(canReceiveEmails)
						.map((participant) => [participant.id, participant])
				)

				const commentsByRecipient = new Map<
					string,
					Array<{
						authorName: string
						content: string
						createdAt: Date
					}>
				>()

				for (const eventComment of eventComments) {
					for (const [participantId] of receiversById) {
						if (participantId === eventComment.userId) {
							continue
						}
						const recipientComments = commentsByRecipient.get(participantId) ?? []
						recipientComments.push({
							authorName: eventComment.authorName?.trim() || 'Someone',
							content: eventComment.content,
							createdAt: eventComment.createdAt
						})
						commentsByRecipient.set(participantId, recipientComments)
					}
				}

				for (const [participantId, comments] of commentsByRecipient) {
					const participant = receiversById.get(participantId)
					if (!participant?.email || comments.length === 0) {
						continue
					}

					try {
						await sendCommentNotificationEmail({
							resend,
							from: senderEmail,
							to: participant.email,
							name: participant.name,
							eventTitle: eventComments[0].eventTitle,
							eventUrl: `${baseUrl}/events/${eventId}`,
							comments,
					locale: normalizeEmailLocale(participant.preferredLanguage)
						})
					} catch (error) {
						console.error(
							`Failed to send comment digest for event ${eventId} to ${participant.email}`,
							error
						)
					}
				}

				if (commentsByRecipient.size > 0) {
					eventComments.forEach((eventComment) => sentCommentIds.add(eventComment.id))
				}
			}

			if (sentCommentIds.size > 0) {
				await db
					.update(eventCommentT)
					.set({ notifiedAt: new Date() })
					.where(inArray(eventCommentT.id, Array.from(sentCommentIds)))

				console.log(`marked ${sentCommentIds.size} comments as notified`)
			}
		}
	}
} satisfies ExportedHandler<Env>

async function getConfirmedParticipants(eventId: string): Promise<ParticipantRow[]> {
	return db
		.select({
			id: user.id,
			email: user.email,
			name: user.name,
			notificationPreferences: user.notificationPreferences,
			emailNotificationsDisabled: user.emailNotificationsDisabled,
			preferredLanguage: user.preferredLanguage
		})
		.from(participantT)
		.innerJoin(user, eq(user.id, participantT.userId))
		.where(and(eq(participantT.eventId, eventId), eq(participantT.status, 'confirmed')))
}

function getCancellationReason(locale: 'en' | 'cs'): string {
	return locale === 'cs' ? 'Nebyl dosažen minimální počet účastníků' : CANCELLATION_REASON
}

function canReceiveEmails(participant: ParticipantRow): boolean {
	return areEmailNotificationsEnabled(
		participant.notificationPreferences,
		participant.emailNotificationsDisabled
	)
}

function requireEnv(env: Env, key: keyof Env): string {
	const value = env[key]
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`)
	}
	return value
}

function formatLocation(name: string | null, address: string | null): string {
	const parts = [name?.trim(), address?.trim()].filter(
		(part): part is string => Boolean(part)
	)
	return parts.length ? parts.join(', ') : LOCATION_FALLBACK
}

function slugify(value: string): string {
	return value
		.replace(/[^a-z0-9]+/gi, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase()
}

interface CalendarEvent {
	title: string
	description: string
	location: string
	startDate: Date
	endDate: Date
}

function toCalendarEvent(eventRow: EventRow, location: string): CalendarEvent {
	const [hours = 0, minutes = 0] = eventRow.startTime
		.split(':')
		.map((part) => Number(part))

	const startDate = new Date(eventRow.date)
	startDate.setHours(hours, minutes, 0, 0)

	const endDate = new Date(startDate)
	endDate.setMinutes(endDate.getMinutes() + eventRow.duration)

	const descriptionLines = [
		eventRow.description?.trim(),
		`Sport: ${eventRow.sport}`,
		`Participants: minimum ${eventRow.minParticipants}`,
		eventRow.idealParticipants
			? `Ideal: ${eventRow.idealParticipants} players`
			: null,
		eventRow.price
			? `Price: ${eventRow.price} ${eventRow.currency ?? ''}`.trim()
			: null,
		eventRow.paymentDetails ? `Payment: ${eventRow.paymentDetails}` : null,
		eventRow.gameRules ? `Game Rules: ${eventRow.gameRules}` : null,
		'',
		'Event created via hraj.eu'
	].filter((line) => line && line.length > 0)

	return {
		title: eventRow.title,
		description: descriptionLines.join('\n'),
		location,
		startDate,
		endDate
	}
}

function generateICalEvent(event: CalendarEvent): string {
	const formatDate = (date: Date): string => {
		return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
	}

	const escapeText = (text: string): string => {
		return text
			.replace(/\\/g, '\\\\')
			.replace(/;/g, '\\;')
			.replace(/,/g, '\\,')
			.replace(/\n/g, '\\n')
	}

	const now = new Date()
	const uid = `event-${Date.now()}@hraj.eu`

	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//hraj.eu//Event Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${formatDate(now)}`,
		`DTSTART:${formatDate(event.startDate)}`,
		`DTEND:${formatDate(event.endDate)}`,
		`SUMMARY:${escapeText(event.title)}`,
		`DESCRIPTION:${escapeText(event.description)}`,
		`LOCATION:${escapeText(event.location)}`,
		'STATUS:CONFIRMED',
		'TRANSP:OPAQUE',
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n')
}
