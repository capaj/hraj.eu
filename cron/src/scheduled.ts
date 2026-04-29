import { Resend } from 'resend'
import { and, eq, gte, isNull, sql } from 'drizzle-orm'
import { eventT, participantT, user, venueT } from '../../web-app/drizzle/schema'
import { sendCancellationEmail } from './email/sendCancellationEmail'
import { sendConfirmationEmail } from './email/sendConfirmationEmail'
import type { Env, EventRow, ParticipantRow } from './types'

const LOCATION_FALLBACK = 'Location TBD'
const DEFAULT_BASE_URL = 'https://hraj.eu'
const CANCELLATION_REASON = 'Minimum participants not reached'

type CronDb = {
	select: (...args: any[]) => any
	update: (...args: any[]) => any
}

export async function runScheduledJob({
	event,
	env,
	database,
	resend = new Resend(requireEnv(env, 'RESEND_API_KEY')),
	sendConfirmation = sendConfirmationEmail,
	sendCancellation = sendCancellationEmail
}: {
	event: ScheduledController
	env: Env
	database: CronDb
	resend?: Resend
	sendConfirmation?: typeof sendConfirmationEmail
	sendCancellation?: typeof sendCancellationEmail
}): Promise<void> {
	const senderEmail = requireEnv(env, 'SENDER_EMAIL')
	const today = new Date().toISOString().split('T')[0]
	const baseUrl = (env.APP_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
	const confirmedCount = sql<number>`(
		select count(${participantT.id})
		from ${participantT}
		where ${participantT.eventId} = ${eventT.id}
			and ${participantT.status} = ${'confirmed'}
	)`

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
		confirmedCount
	}

	const eventsToConfirm = (await database
		.select(eventSelection)
		.from(eventT)
		.leftJoin(venueT, eq(venueT.id, eventT.venueId))
		.where(
			and(
				eq(eventT.status, 'open'),
				isNull(eventT.confirmedAt),
				gte(eventT.date, today),
				sql`${confirmedCount} >= ${eventT.minParticipants}`
			)
		)) as EventRow[]

	console.log(`found ${eventsToConfirm.length} events to confirm`)
	if (!eventsToConfirm.length) {
		console.log(`trigger fired at ${event.cron}: no events to confirm`)
	}

	for (const eventRow of eventsToConfirm) {
		const updated = await database
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

		const participants = await getConfirmedParticipants(database, eventRow.id)
		const location = formatLocation(eventRow.venueName, eventRow.venueAddress)
		const calendarEvent = toCalendarEvent(eventRow, location)
		const icalContent = generateICalEvent(calendarEvent)
		const icsFilename = `${slugify(eventRow.title || 'event')}.ics`
		const eventUrl = `${baseUrl}/events/${eventRow.id}`

		for (const attendee of participants) {
			if (!attendee.email) {
				continue
			}

			try {
				await sendConfirmation({
					resend,
					from: senderEmail,
					to: attendee.email,
					name: attendee.name,
					event: eventRow,
					location,
					eventUrl,
					icalContent,
					icsFilename
				})
			} catch (error) {
				console.error(
					`Failed to send confirmation email for event ${eventRow.id} to ${attendee.email}`,
					error
				)
			}
		}

		console.log(
			`Confirmed event ${eventRow.id} and emailed ${participants.length} attendees`
		)
	}

	const cancellationDeadlineReached = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime}, '-' || ${eventT.cancellationDeadlineMinutes} || ' minutes') <= datetime('now')`

	const eventsToCancel = (await database
		.select(eventSelection)
		.from(eventT)
		.leftJoin(venueT, eq(venueT.id, eventT.venueId))
		.where(
			and(
				eq(eventT.status, 'open'),
				isNull(eventT.cancellationCheckRanAt),
				gte(eventT.date, today),
				cancellationDeadlineReached,
				sql`${confirmedCount} < ${eventT.minParticipants}`
			)
		)) as EventRow[]

	console.log(`found ${eventsToCancel.length} events to cancel`)
	for (const eventRow of eventsToCancel) {
		const updated = await database
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

		const participants = await getConfirmedParticipants(database, eventRow.id)
		const location = formatLocation(eventRow.venueName, eventRow.venueAddress)
		const eventUrl = `${baseUrl}/events/${eventRow.id}`

		for (const attendee of participants) {
			if (!attendee.email) {
				continue
			}

			try {
				await sendCancellation({
					resend,
					from: senderEmail,
					to: attendee.email,
					name: attendee.name,
					event: eventRow,
					location,
					eventUrl,
					reason: CANCELLATION_REASON
				})
			} catch (error) {
				console.error(
					`Failed to send cancellation email for event ${eventRow.id} to ${attendee.email}`,
					error
				)
			}
		}

		console.log(
			`Cancelled event ${eventRow.id} and emailed ${participants.length} attendees`
		)
	}
}

async function getConfirmedParticipants(
	database: CronDb,
	eventId: string
): Promise<ParticipantRow[]> {
	return database
		.select({ email: user.email, name: user.name })
		.from(participantT)
		.innerJoin(user, eq(user.id, participantT.userId))
		.where(
			and(eq(participantT.eventId, eventId), eq(participantT.status, 'confirmed'))
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
