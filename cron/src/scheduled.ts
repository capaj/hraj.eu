import { Resend } from 'resend'
import { and, eq, gte, isNull, sql } from 'drizzle-orm'
import { eventT, participantT, user, venueT } from '../../web-app/drizzle/schema'
import { sendCancellationEmail } from './email/sendCancellationEmail'
import { sendConfirmationEmail } from './email/sendConfirmationEmail'
import type { Env, EventRow, ParticipantRow } from './types'

const LOCATION_FALLBACK = 'Location TBD'
const DEFAULT_BASE_URL = 'https://hraj.eu'
const CANCELLATION_REASON = 'Minimum participants not reached'
const CONFIRMED_COUNTS_ALIAS = 'confirmed_counts'
const CONFIRMED_COUNT_ALIAS = 'confirmed_count'
const DEFAULT_EVENT_TIMEZONE = 'Europe/Prague'

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
	const confirmedCount = sql<number>`cast(count(${participantT.id}) as int)`.as(
		CONFIRMED_COUNT_ALIAS
	)
	const confirmedCounts = database
		.select({
			eventId: participantT.eventId,
			confirmedCount
		})
		.from(participantT)
		.where(eq(participantT.status, 'confirmed'))
		.groupBy(participantT.eventId)
		.as(CONFIRMED_COUNTS_ALIAS)
	const confirmedCountOrZero = sql<number>`coalesce(${sql.identifier(
		CONFIRMED_COUNTS_ALIAS
	)}.${sql.identifier(CONFIRMED_COUNT_ALIAS)}, 0)`
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

	const eventsToConfirm = (await database
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
		const icsFilename = `${slugify(eventRow.title || 'event')}.ics`
		const eventUrl = `${baseUrl}/events/${eventRow.id}`

		for (const attendee of participants) {
			if (!attendee.email) {
				continue
			}

			try {
				const calendarEvent = toCalendarEvent(
					eventRow,
					location,
					attendee.timezone ?? DEFAULT_EVENT_TIMEZONE
				)
				const icalContent = generateICalEvent(calendarEvent)

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
		.select({ email: user.email, name: user.name, timezone: user.timezone })
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
	startDateTime: string
	endDateTime: string
	timezone: string
}

function toCalendarEvent(
	eventRow: EventRow,
	location: string,
	timezone: string
): CalendarEvent {
	const startDateTime = formatLocalICalDateTime(
		eventRow.date,
		eventRow.startTime
	)
	const endDateTime = addMinutesToLocalDateTime(
		eventRow.date,
		eventRow.startTime,
		eventRow.duration
	)

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
		startDateTime,
		endDateTime,
		timezone
	}
}

function formatLocalICalDateTime(date: string, time: string): string {
	const [year, month, day] = date.split('-').map((part) => Number(part))
	const [hours = 0, minutes = 0] = time.split(':').map((part) => Number(part))

	return [
		padNumber(year, 4),
		padNumber(month),
		padNumber(day),
		'T',
		padNumber(hours),
		padNumber(minutes),
		'00'
	].join('')
}

function addMinutesToLocalDateTime(
	date: string,
	time: string,
	durationMinutes: number
): string {
	const [year, month, day] = date.split('-').map((part) => Number(part))
	const [hours = 0, minutes = 0] = time.split(':').map((part) => Number(part))
	const utcDate = new Date(
		Date.UTC(year, month - 1, day, hours, minutes + durationMinutes, 0, 0)
	)

	return [
		padNumber(utcDate.getUTCFullYear(), 4),
		padNumber(utcDate.getUTCMonth() + 1),
		padNumber(utcDate.getUTCDate()),
		'T',
		padNumber(utcDate.getUTCHours()),
		padNumber(utcDate.getUTCMinutes()),
		'00'
	].join('')
}

function padNumber(value: number, length = 2): string {
	return String(value).padStart(length, '0')
}

function generateICalEvent(event: CalendarEvent): string {
	const formatUtcDate = (date: Date): string => {
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
		`DTSTAMP:${formatUtcDate(now)}`,
		`DTSTART;TZID=${event.timezone}:${event.startDateTime}`,
		`DTEND;TZID=${event.timezone}:${event.endDateTime}`,
		`SUMMARY:${escapeText(event.title)}`,
		`DESCRIPTION:${escapeText(event.description)}`,
		`LOCATION:${escapeText(event.location)}`,
		'STATUS:CONFIRMED',
		'TRANSP:OPAQUE',
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n')
}
