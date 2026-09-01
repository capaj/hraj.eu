import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { leaveEventHandler } from '../src/server-functions/leaveEventHandler.ts'

async function createLeaveEventDatabase(t) {
  const directory = await mkdtemp(join(tmpdir(), 'hraj-leave-event-'))
  const client = createClient({ url: `file:${join(directory, 'test.db')}` })
  t.after(async () => {
    client.close()
    await rm(directory, { recursive: true, force: true })
  })
  await client.batch(
    [
      `CREATE TABLE event (
        id TEXT PRIMARY KEY,
        max_participants INTEGER NOT NULL,
        reserved_participants INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE participant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        plus_attendees TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL,
        confirmed_participant_ordinal INTEGER NOT NULL,
        payment_intent_recorded_at INTEGER,
        marked_as_paid_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        UNIQUE (event_id, user_id)
      )`
    ],
    'write'
  )
  return client
}

test('converts referenced guests before considering the waitlist', async (t) => {
  const client = await createLeaveEventDatabase(t)

  await client.execute({
    sql: `INSERT INTO event (id, max_participants, reserved_participants)
      VALUES (?, ?, ?)`,
    args: ['event-1', 4, 0]
  })
  await client.batch(
    [
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status, confirmed_participant_ordinal, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'event-1',
          'departing',
          JSON.stringify([
            { name: 'Guest A', userId: 'guest-a' },
            { name: 'Guest B', userId: 'guest-b' }
          ]),
          'confirmed',
          1,
          1
        ]
      },
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status, confirmed_participant_ordinal, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['event-1', 'other-player', '[]', 'confirmed', 2, 2]
      },
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status, confirmed_participant_ordinal, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'event-1',
          'waitlisted-group',
          JSON.stringify(['Waitlisted guest']),
          'waitlisted',
          3,
          3
        ]
      }
    ],
    'write'
  )

  const result = await leaveEventHandler(drizzle(client), {
    eventId: 'event-1',
    userId: 'departing'
  })

  const rows = await client.execute(
    `SELECT user_id, status, plus_attendees
      FROM participant
      WHERE event_id = 'event-1'
      ORDER BY user_id`
  )
  const participants = new Map(
    rows.rows.map((row) => [
      row.user_id,
      { status: row.status, plusAttendees: JSON.parse(row.plus_attendees) }
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
  const client = await createLeaveEventDatabase(t)

  await client.batch(
    [
      `INSERT INTO event (id, max_participants, reserved_participants)
        VALUES ('event-1', 4, 0)`,
      `INSERT INTO participant
        (event_id, user_id, plus_attendees, status, confirmed_participant_ordinal)
        VALUES (
          'event-1',
          'departing',
          '[{"name":"Guest A","userId":"guest-a"},{"name":"Guest B","userId":"guest-b"}]',
          'confirmed',
          1
        )`,
      `CREATE TRIGGER reject_guest_b
        BEFORE INSERT ON participant
        WHEN NEW.user_id = 'guest-b'
        BEGIN
          SELECT RAISE(ABORT, 'guest conversion failed');
        END`
    ],
    'write'
  )

  await assert.rejects(
    leaveEventHandler(drizzle(client), {
      eventId: 'event-1',
      userId: 'departing'
    })
  )

  const rows = await client.execute(
    `SELECT user_id, status, plus_attendees
      FROM participant
      WHERE event_id = 'event-1'`
  )

  assert.equal(rows.rows.length, 1)
  assert.equal(rows.rows[0].user_id, 'departing')
  assert.equal(rows.rows[0].status, 'confirmed')
  assert.equal(JSON.parse(rows.rows[0].plus_attendees).length, 2)
})
