import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { eventT, participantT } from '../drizzle/schema.ts'
import { leaveEventHandler } from '../src/server-functions/leaveEventHandler.ts'
import { createPaymentTestDatabase } from './fioPglite.mjs'

async function setup(t) {
  const fixture = await createPaymentTestDatabase(t)
  await fixture.database
    .update(eventT)
    .set({ paymentMode: 'manual', requirePayment: false, maxParticipants: 4 })
    .where(eq(eventT.id, 'event'))
  return fixture
}

test('converts referenced guests before considering the waitlist', async (t) => {
  const { database } = await setup(t)
  await database.insert(participantT).values([
    {
      eventId: 'event',
      userId: 'departing',
      plusAttendees: [
        { name: 'Guest A', userId: 'guest-a' },
        { name: 'Guest B', userId: 'guest-b' }
      ],
      status: 'confirmed',
      confirmedParticipantOrdinal: 1
    },
    {
      eventId: 'event',
      userId: 'other-player',
      status: 'confirmed',
      confirmedParticipantOrdinal: 2
    },
    {
      eventId: 'event',
      userId: 'waitlisted-group',
      plusAttendees: ['Waitlisted guest'],
      status: 'waitlisted',
      confirmedParticipantOrdinal: 3
    }
  ])
  const result = await leaveEventHandler(database, {
    eventId: 'event',
    userId: 'departing'
  })
  const rows = await database.select().from(participantT)
  const participants = new Map(
    rows.map((row) => [
      row.userId,
      { status: row.status, plusAttendees: row.plusAttendees }
    ])
  )
  assert.deepEqual(result.convertedGuestUserIds, ['guest-a', 'guest-b'])
  assert.deepEqual(participants.get('departing'), {
    status: 'cancelled',
    plusAttendees: []
  })
  assert.equal(participants.get('guest-a').status, 'confirmed')
  assert.equal(participants.get('guest-b').status, 'confirmed')
  assert.equal(participants.get('waitlisted-group').status, 'waitlisted')
})

test('rolls back the departure if a referenced guest cannot be converted', async (t) => {
  const { database, pg } = await setup(t)
  await database.insert(participantT).values({
    eventId: 'event',
    userId: 'departing',
    plusAttendees: [
      { name: 'Guest A', userId: 'guest-a' },
      { name: 'Guest B', userId: 'guest-b' }
    ],
    status: 'confirmed',
    confirmedParticipantOrdinal: 1
  })
  await pg.exec(
    "ALTER TABLE participant ADD CONSTRAINT reject_guest_b CHECK (user_id <> 'guest-b')"
  )
  await assert.rejects(
    leaveEventHandler(database, { eventId: 'event', userId: 'departing' })
  )
  const rows = await database.select().from(participantT)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].userId, 'departing')
  assert.equal(rows[0].status, 'confirmed')
  assert.equal(rows[0].plusAttendees.length, 2)
})
