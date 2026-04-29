import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { seed } from 'drizzle-seed'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import * as schema from '../../web-app/drizzle/schema'
import { eventT, participantT, user, venueT } from '../../web-app/drizzle/schema'
import { runScheduledJob } from './scheduled'
import type { Env } from './types'

const env: Env = {
	TURSO_DATABASE_URL: 'file:test.db',
	TURSO_AUTH_TOKEN: 'test-token',
	RESEND_API_KEY: 'test-resend-key',
	SENDER_EMAIL: 'noreply@example.com',
	APP_BASE_URL: 'https://example.com'
}

describe('runScheduledJob', () => {
	let tempDir: string
	let client: Client
	let database: ReturnType<typeof drizzle<typeof schema>>
	let queries: string[]

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), 'hraj-cron-'))
		client = createClient({ url: `file:${join(tempDir, 'test.db')}` })
		queries = []
		database = drizzle(client, {
			schema,
			logger: {
				logQuery(query) {
					queries.push(query)
				}
			}
		})
		await migrate(database, {
			migrationsFolder: resolve('../web-app/drizzle/migrations')
		})
	})

	afterEach(async () => {
		client.close()
		await rm(tempDir, { force: true, recursive: true })
	})

	it('confirms events that reached the minimum participant count', async () => {
		const confirmationEmails: unknown[] = []
		const cancellationEmails: unknown[] = []
		const today = new Date().toISOString().split('T')[0]

		await seedCronData(database, {
			id: 'event-to-confirm',
			date: today,
			minParticipants: 2,
			startTime: '18:00',
			participants: [
				{ id: 1, userId: 'u1' },
				{ id: 2, userId: 'u2' }
			],
			users: [
				{
					id: 'u1',
					name: 'Alice',
					email: 'alice@example.com',
					timezone: 'America/New_York'
				},
				{ id: 'u2', name: 'Bob', email: 'bob@example.com' }
			]
		})
		await runScheduledJob({
			event: scheduledEvent(),
			env,
			database,
			resend: {} as never,
			sendConfirmation: vi.fn(async (payload) => {
				confirmationEmails.push(payload)
			}),
			sendCancellation: vi.fn(async (payload) => {
				cancellationEmails.push(payload)
			})
		})

		const eventRow = await client.execute({
			sql: 'select status, confirmed_at from event where id = ?',
			args: ['event-to-confirm']
		})

		expect(eventRow.rows[0]?.status).toBe('confirmed')
		expect(eventRow.rows[0]?.confirmed_at).not.toBeNull()
		expect(confirmationEmails).toHaveLength(2)
		expect(cancellationEmails).toHaveLength(0)
		expect(confirmationEmails[0]).toMatchObject({
			from: env.SENDER_EMAIL,
			to: 'alice@example.com',
			location: 'Test Arena, Main Street 1',
			eventUrl: 'https://example.com/events/event-to-confirm',
			icsFilename: 'test_match.ics'
		})
		const confirmationEmail = confirmationEmails[0] as { icalContent: string }
		expect(confirmationEmail.icalContent).toContain('TZID=America/New_York')
		expect(confirmationEmail.icalContent).toContain(
			`DTSTART;TZID=America/New_York:${today.replace(/-/g, '')}T180000`
		)
		expect(confirmationEmail.icalContent).toContain(
			`DTEND;TZID=America/New_York:${today.replace(/-/g, '')}T193000`
		)
		expect(confirmationEmail.icalContent).not.toMatch(
			/DTSTART:\d{8}T\d{6}Z/
		)
		expect(queries).toContainEqual(expect.stringContaining('left join (select'))
		expect(queries).not.toContainEqual(
			expect.stringContaining('"participant"."event_id" = "event"."id"')
		)
	})

	it('cancels open events after the deadline when the minimum was not reached', async () => {
		const confirmationEmails: unknown[] = []
		const cancellationEmails: unknown[] = []
		const today = new Date().toISOString().split('T')[0]

		await seedCronData(database, {
			id: 'event-to-cancel',
			date: today,
			minParticipants: 2,
			startTime: '00:00',
			participants: [{ id: 1, userId: 'u1' }],
			users: [{ id: 'u1', name: 'Alice', email: 'alice@example.com' }]
		})

		await runScheduledJob({
			event: scheduledEvent(),
			env,
			database,
			resend: {} as never,
			sendConfirmation: vi.fn(async (payload) => {
				confirmationEmails.push(payload)
			}),
			sendCancellation: vi.fn(async (payload) => {
				cancellationEmails.push(payload)
			})
		})

		const eventRow = await client.execute({
			sql: 'select status, cancellation_reason, cancellation_check_ran_at from event where id = ?',
			args: ['event-to-cancel']
		})

		expect(eventRow.rows[0]?.status).toBe('cancelled')
		expect(eventRow.rows[0]?.cancellation_reason).toBe(
			'Minimum participants not reached'
		)
		expect(eventRow.rows[0]?.cancellation_check_ran_at).not.toBeNull()
		expect(confirmationEmails).toHaveLength(0)
		expect(cancellationEmails).toHaveLength(1)
		expect(cancellationEmails[0]).toMatchObject({
			from: env.SENDER_EMAIL,
			to: 'alice@example.com',
			location: 'Test Arena, Main Street 1',
			eventUrl: 'https://example.com/events/event-to-cancel',
			reason: 'Minimum participants not reached'
		})
	})
})

async function seedCronData(
	database: ReturnType<typeof drizzle<typeof schema>>,
	{
		id,
		date,
		minParticipants,
		startTime,
		participants,
		users
	}: {
		id: string
		date: string
		minParticipants: number
		startTime: string
		participants: { id: number; userId: string }[]
		users: { id: string; name: string; email: string; timezone?: string }[]
	}
): Promise<void> {
	await seed(
		database as unknown as Parameters<typeof seed>[0],
		{
			venue: venueT,
			user,
			event: eventT,
			participant: participantT
		},
		{ count: 1, seed: 1 }
	).refine((funcs) => ({
		venue: {
			columns: {
				id: funcs.default({ defaultValue: 'venue-1' }),
				name: funcs.default({ defaultValue: 'Test Arena' }),
				address: funcs.default({ defaultValue: 'Main Street 1' })
			}
		},
		user: {
			count: users.length,
			columns: {
				id: funcs.valuesFromArray({
					values: users.map((seedUser) => seedUser.id),
					isUnique: true
				}),
				name: funcs.valuesFromArray({
					values: users.map((seedUser) => seedUser.name)
				}),
				email: funcs.valuesFromArray({
					values: users.map((seedUser) => seedUser.email),
					isUnique: true
				}),
				timezone: funcs.valuesFromArray({
					values: users.map((seedUser) => seedUser.timezone ?? null)
				}),
				emailVerified: funcs.default({ defaultValue: true }),
				karmaPoints: funcs.default({ defaultValue: 0 })
			}
		},
		event: {
			columns: {
				id: funcs.default({ defaultValue: id }),
				title: funcs.default({ defaultValue: 'Test Match' }),
				description: funcs.default({ defaultValue: 'Bring shoes' }),
				sport: funcs.default({ defaultValue: 'soccer' }),
				venueId: funcs.default({ defaultValue: 'venue-1' }),
				date: funcs.default({ defaultValue: date }),
				startTime: funcs.default({ defaultValue: startTime }),
				duration: funcs.default({ defaultValue: 90 }),
				minParticipants: funcs.default({ defaultValue: minParticipants }),
				idealParticipants: funcs.default({ defaultValue: null }),
				maxParticipants: funcs.default({ defaultValue: 10 }),
				cancellationDeadlineMinutes: funcs.default({ defaultValue: 1 }),
				price: funcs.default({ defaultValue: null }),
				currency: funcs.default({ defaultValue: 'CZK' }),
				paymentDetails: funcs.default({ defaultValue: null }),
				gameRules: funcs.default({ defaultValue: null }),
				isPublic: funcs.default({ defaultValue: true }),
				organizerId: funcs.default({ defaultValue: 'u1' }),
				requiredSkillLevel: funcs.default({ defaultValue: null }),
				status: funcs.default({ defaultValue: 'open' }),
				cancellationReason: funcs.default({ defaultValue: null }),
				cancellationCheckRanAt: funcs.default({ defaultValue: null }),
				recurringInDays: funcs.default({ defaultValue: null }),
				seriesId: funcs.default({ defaultValue: id }),
				ordinalInSeries: funcs.default({ defaultValue: 1 }),
				confirmedAt: funcs.default({ defaultValue: null }),
				qrCodeImages: funcs.default({ defaultValue: [] }),
				coreGroupId: funcs.default({ defaultValue: null }),
				coreGroupExclusiveUntil: funcs.default({ defaultValue: null })
			}
		},
		participant: {
			count: participants.length,
			columns: {
				id: funcs.valuesFromArray({
					values: participants.map((participant) => participant.id),
					isUnique: true
				}),
				eventId: funcs.default({ defaultValue: id }),
				userId: funcs.valuesFromArray({
					values: participants.map((participant) => participant.userId),
					isUnique: true
				}),
				plusAttendees: funcs.default({ defaultValue: [] }),
				status: funcs.default({ defaultValue: 'confirmed' }),
				confirmedParticipantOrdinal: funcs.valuesFromArray({
					values: participants.map((participant) => participant.id),
					isUnique: true
				})
			}
		}
	}))
}

function scheduledEvent(): ScheduledController {
	return {
		cron: '*/30 * * * *',
		scheduledTime: Date.now()
	} as ScheduledController
}
