import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import {
  EVENT_GUEST_USER_SEARCH_LIMIT,
  searchEventGuestUsersHandler
} from '../src/server-functions/searchEventGuestUsersHandler.ts'

test('searches 20 players by name and excludes people already in the event', async (t) => {
  const client = createClient({ url: 'file::memory:' })
  t.after(() => client.close())

  await client.batch(
    [
      'CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL, image TEXT)',
      `CREATE TABLE participant (
        id INTEGER PRIMARY KEY,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        plus_attendees TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL
      )`
    ],
    'write'
  )

  const users = [
    { id: 'confirmed', name: 'Anna Confirmed' },
    { id: 'waitlisted', name: 'Adam Waitlisted' },
    { id: 'cancelled', name: 'Aaron Returned' },
    { id: 'other-guest', name: 'Alice Other Guest' },
    { id: 'own-guest', name: 'Avery Own Guest' },
    ...Array.from({ length: 24 }, (_, index) => ({
      id: `available-${index}`,
      name: `Available Player ${String(index).padStart(2, '0')}`
    })),
    { id: 'contains-only', name: 'Zara' }
  ]

  await client.batch(
    users.map((user) => ({
      sql: 'INSERT INTO user (id, name) VALUES (?, ?)',
      args: [user.id, user.name]
    })),
    'write'
  )

  await client.batch(
    [
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status)
          VALUES (?, ?, ?, ?)`,
        args: ['event-1', 'confirmed', '[]', 'confirmed']
      },
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status)
          VALUES (?, ?, ?, ?)`,
        args: ['event-1', 'waitlisted', '[]', 'waitlisted']
      },
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status)
          VALUES (?, ?, ?, ?)`,
        args: ['event-1', 'cancelled', '[]', 'cancelled']
      },
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status)
          VALUES (?, ?, ?, ?)`,
        args: [
          'event-1',
          'other-owner',
          JSON.stringify([{ name: 'Alice Other Guest', userId: 'other-guest' }]),
          'confirmed'
        ]
      },
      {
        sql: `INSERT INTO participant
          (event_id, user_id, plus_attendees, status)
          VALUES (?, ?, ?, ?)`,
        args: [
          'event-1',
          'viewer',
          JSON.stringify([{ name: 'Avery Own Guest', userId: 'own-guest' }]),
          'cancelled'
        ]
      }
    ],
    'write'
  )

  const results = await searchEventGuestUsersHandler(
    drizzle(client),
    { eventId: 'event-1', query: 'A' },
    'viewer'
  )

  assert.equal(results.length, EVENT_GUEST_USER_SEARCH_LIMIT)
  assert.ok(results.some((user) => user.id === 'cancelled'))
  assert.ok(!results.some((user) => user.id === 'confirmed'))
  assert.ok(!results.some((user) => user.id === 'waitlisted'))
  assert.ok(!results.some((user) => user.id === 'other-guest'))
  assert.ok(!results.some((user) => user.id === 'contains-only'))

  const ownGuestResults = await searchEventGuestUsersHandler(
    drizzle(client),
    { eventId: 'event-1', query: 'Avery' },
    'viewer'
  )
  assert.deepEqual(
    ownGuestResults.map((user) => user.id),
    ['own-guest']
  )
})

test('requires at least one non-whitespace search character', async () => {
  const results = await searchEventGuestUsersHandler(
    {
      select() {
        throw new Error('the database should not be queried')
      }
    },
    { eventId: 'event-1', query: '   ' }
  )

  assert.deepEqual(results, [])
})
