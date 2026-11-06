import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { and, eq } from 'drizzle-orm'
import { coreGroupMemberT, eventT, organizerBlockT, participantT, paymentRequestT, user } from '../drizzle/schema.ts'
import { createPaymentTestDatabase } from './fioPglite.mjs'
import { setOrganizerBlockHandler } from '../src/server-functions/organizerBlocksHandler.ts'
import { assertEventAccess, eventsVisibleToUser } from '../src/server-functions/organizerBlockPolicy.ts'
import { joinEventHandler } from '../src/server-functions/joinEventHandler.ts'
import { getEventsHandler } from '../src/server-functions/getEventsHandler.ts'
import { queryVenueHistory } from '../src/server-functions/venueHistory.ts'
import { ensurePaymentRequests } from '../src/lib/fio/payments.ts'
import { assertNoVenueEventConflict } from '../src/server-functions/eventVenueConflicts.ts'

async function copyEvent(database, id, updates = {}) {
  const [source] = await database.select().from(eventT).where(eq(eventT.id, 'event'))
  await database.insert(eventT).values({ ...source, id, ...updates })
}

test('the migration enforces unique organizer/player pairs and cascades account deletion in memory', async (t) => {
  const { database, pg } = await createPaymentTestDatabase(t)
  const migration = await readFile(new URL('../drizzle/migrations/0020_organizer_blocks.sql', import.meta.url), 'utf8')
  // Translate only SQLite identifier quoting and implicit rowid allocation.
  await pg.exec('DROP TABLE organizer_block')
  await pg.exec(migration.replaceAll('`', '"').replace('"id" integer PRIMARY KEY', '"id" serial PRIMARY KEY'))
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  await setOrganizerBlockHandler(database, 'petr', { userId: 'anna', blocked: true })
  await assert.rejects(database.insert(organizerBlockT).values({ organizerId: 'organizer', userId: 'anna' }))
  await assert.rejects(database.insert(organizerBlockT).values({ organizerId: 'organizer', userId: 'missing' }))
  await database.delete(user).where(eq(user.id, 'petr'))
  assert.equal((await database.select().from(organizerBlockT)).length, 1)
  await database.delete(user).where(eq(user.id, 'anna'))
  assert.deepEqual(await database.select().from(organizerBlockT), [])
})

test('blocks require a session, reject self/missing users, are idempotent, and belong to the acting organizer', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await assert.rejects(setOrganizerBlockHandler(database, undefined, { userId: 'anna', blocked: true }), /signed in/)
  await assert.rejects(setOrganizerBlockHandler(database, 'organizer', { userId: 'organizer', blocked: true }), /yourself/)
  await assert.rejects(setOrganizerBlockHandler(database, 'organizer', { userId: 'missing', blocked: true }), /not found/)
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  await setOrganizerBlockHandler(database, 'petr', { userId: 'anna', blocked: true })
  assert.equal((await database.select().from(organizerBlockT)).length, 2)
  await setOrganizerBlockHandler(database, 'petr', { userId: 'anna', blocked: false })
  await assert.rejects(assertEventAccess(database, 'event', 'anna'), /organizer has blocked/)
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: false })
  await assertEventAccess(database, 'event', 'anna')
})

test('blocks hide all event listings, including private bookings and core-group membership, before pagination', async (t) => {
  const { database } = await createPaymentTestDatabase(t, [coreGroupMemberT])
  await database.update(eventT).set({ isPublic: true }).where(eq(eventT.id, 'event'))
  await copyEvent(database, 'private', { isPublic: false, coreGroupId: 'team', coreGroupExclusiveUntil: new Date(Date.now() + 86400000) })
  await copyEvent(database, 'other-organizer', { organizerId: 'petr', paymentMode: 'manual', requirePayment: false })
  await copyEvent(database, 'past', { date: '2020-01-01', venueId: 'venue', status: 'completed' })
  await database.insert(coreGroupMemberT).values({ coreGroupId: 'team', userId: 'anna' })
  await joinEventHandler(database, { eventId: 'private', userId: 'anna' })
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  const events = await getEventsHandler(database, { includeOwnPrivateEvents: true, pastEventsLimit: 1 }, 'anna')
  assert.deepEqual(events.map((event) => event.id), ['other-organizer'])
  const filtered = await database.select({ id: eventT.id }).from(eventT).where(eventsVisibleToUser('anna')).limit(1)
  assert.deepEqual(filtered.map((event) => event.id), ['other-organizer'])
  const history = await queryVenueHistory(database, 'venue', 1, new Date(), 'anna')
  assert.equal(history.total, 0)
  assert.deepEqual(history.events, [])
  for (const id of ['event', 'private', 'past']) await assert.rejects(assertEventAccess(database, id, 'anna'), /organizer has blocked/)
  await assertEventAccess(database, 'event', 'organizer')
  await assertEventAccess(database, 'event', 'jan')
  await assertEventAccess(database, 'event')
  await assertEventAccess(database, 'other-organizer', 'anna')
  await assert.rejects(assertEventAccess(database, 'missing', 'anna'), /Event not found/)
})

test('blocks stop direct joins, rejoining, waitlisting, and adding a linked guest through either endpoint', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await database.update(eventT).set({ paymentMode: 'manual', requirePayment: false, maxParticipants: 5 }).where(eq(eventT.id, 'event'))
  await joinEventHandler(database, { eventId: 'event', userId: 'anna' })
  await joinEventHandler(database, { eventId: 'event', userId: 'petr' })
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  await assert.rejects(joinEventHandler(database, { eventId: 'event', userId: 'anna' }), /organizer has blocked/)
  await assert.rejects(joinEventHandler(database, { eventId: 'event', userId: 'anna', updatingGuests: true }), /organizer has blocked/)
  for (const input of [{ userId: 'jan' }, { userId: 'petr', updatingGuests: true }]) {
    await assert.rejects(joinEventHandler(database, {
      eventId: 'event', ...input, plusAttendees: [{ name: 'Someone else', userId: 'anna' }]
    }), /selected guest is blocked/)
  }
  await database.update(eventT).set({ maxParticipants: 1 }).where(eq(eventT.id, 'event'))
  await assert.rejects(joinEventHandler(database, { eventId: 'event', userId: 'anna' }), /organizer has blocked/)
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: false })
  assert.equal(await joinEventHandler(database, { eventId: 'event', userId: 'anna' }), 'waitlisted')
})

test('blocking cancels upcoming bookings/payments and promotes the waitlist, preserving history and other organizers', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await copyEvent(database, 'other', { organizerId: 'petr' })
  await copyEvent(database, 'past', { date: '2020-01-01', status: 'completed' })
  await joinEventHandler(database, { eventId: 'event', userId: 'anna', plusAttendees: ['Friend'] })
  await joinEventHandler(database, { eventId: 'event', userId: 'jan' })
  await joinEventHandler(database, { eventId: 'other', userId: 'anna' })
  await database.insert(participantT).values({ eventId: 'past', userId: 'anna', status: 'confirmed', confirmedParticipantOrdinal: 1 })
  const result = await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  assert.deepEqual(result.affectedEventIds, ['event'])
  const rows = await database.select().from(participantT)
  const booking = (eventId, userId) => rows.find((row) => row.eventId === eventId && row.userId === userId)
  assert.equal(booking('event', 'anna').status, 'cancelled')
  assert.deepEqual(booking('event', 'anna').plusAttendees, [])
  assert.equal(booking('event', 'jan').status, 'pending_payment')
  assert.equal(booking('other', 'anna').status, 'pending_payment')
  assert.equal(booking('past', 'anna').status, 'confirmed')
  const requests = await database.select().from(paymentRequestT).where(eq(paymentRequestT.participantId, booking('event', 'anna').id))
  assert.equal(requests.length, 2)
  assert.ok(requests.every((request) => request.cancelledAt))
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: false })
  const [cancelled] = await database.select().from(participantT).where(eq(participantT.id, booking('event', 'anna').id))
  assert.equal(cancelled.status, 'cancelled')
})

test('removing a linked guest preserves remaining guest payments and frees the spot', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await database.update(eventT).set({ maxParticipants: 3 }).where(eq(eventT.id, 'event'))
  await joinEventHandler(database, { eventId: 'event', userId: 'petr', plusAttendees: [{ name: 'Anna', userId: 'anna' }, { name: 'Guest' }] })
  await joinEventHandler(database, { eventId: 'event', userId: 'jan' })
  await setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true })
  const [host] = await database.select().from(participantT).where(and(eq(participantT.eventId, 'event'), eq(participantT.userId, 'petr')))
  assert.deepEqual(host.plusAttendees, [{ name: 'Guest' }])
  const requests = await database.select().from(paymentRequestT).where(eq(paymentRequestT.participantId, host.id))
  assert.ok(requests.find((request) => request.playerName === 'anna').cancelledAt)
  assert.equal(requests.find((request) => request.playerName === 'Guest').slot, 1)
  assert.equal(requests.find((request) => request.playerName === 'Guest').cancelledAt, null)
  const [event] = await database.select().from(eventT).where(eq(eventT.id, 'event'))
  await ensurePaymentRequests(database, event, host)
  assert.equal((await database.select().from(paymentRequestT).where(eq(paymentRequestT.participantId, host.id))).length, 3)
  const [waiting] = await database.select().from(participantT).where(eq(participantT.userId, 'jan'))
  assert.equal(waiting.status, 'pending_payment')
})

test('a failed cancellation rolls back both the block and the booking', async (t) => {
  const { database, pg } = await createPaymentTestDatabase(t)
  await joinEventHandler(database, { eventId: 'event', userId: 'anna' })
  await pg.exec("ALTER TABLE participant ADD CONSTRAINT reject_cancel CHECK (status <> 'cancelled')")
  await assert.rejects(setOrganizerBlockHandler(database, 'organizer', { userId: 'anna', blocked: true }))
  assert.deepEqual(await database.select().from(organizerBlockT), [])
  const [participant] = await database.select().from(participantT)
  assert.equal(participant.status, 'pending_payment')
})

test('venue conflict errors do not disclose a blocked event’s details', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await database.update(eventT).set({ venueId: 'venue', title: 'Secret game' }).where(eq(eventT.id, 'event'))
  await database.insert(organizerBlockT).values({ organizerId: 'organizer', userId: 'anna' })
  const input = { venueId: 'venue', date: '2099-10-29', startTime: '18:30', duration: 90 }
  await assert.rejects(assertNoVenueEventConflict(database, { ...input, viewerId: 'anna' }), (error) => {
    assert.equal(error.message, 'This venue already has an event at that time.')
    return true
  })
  await assert.rejects(assertNoVenueEventConflict(database, { ...input, viewerId: 'petr' }), /Secret game/)
})
