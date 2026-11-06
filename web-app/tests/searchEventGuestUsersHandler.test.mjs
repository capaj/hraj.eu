import test from 'node:test'
import assert from 'node:assert/strict'
import { createPaymentTestDatabase } from './fioPglite.mjs'
import { participantT, user as userT, organizerBlockT } from '../drizzle/schema.ts'
import {
  EVENT_GUEST_USER_SEARCH_LIMIT,
  searchEventGuestUsersHandler
} from '../src/server-functions/searchEventGuestUsersHandler.ts'

test('searches 20 players by name and excludes people already in the event', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
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

  await database.insert(userT).values(users.map((user) => ({
    ...user, email: `${user.id}@example.test`, emailVerified: true
  })))
  await database.insert(participantT).values([
    { userId: 'confirmed', status: 'confirmed' },
    { userId: 'waitlisted', status: 'waitlisted' },
    { userId: 'cancelled', status: 'cancelled' },
    { userId: 'other-owner', status: 'confirmed', plusAttendees: [{ name: 'Alice Other Guest', userId: 'other-guest' }] },
    { userId: 'viewer', status: 'cancelled', plusAttendees: [{ name: 'Avery Own Guest', userId: 'own-guest' }] }
  ].map((participant, index) => ({ eventId: 'event', confirmedParticipantOrdinal: index + 1, ...participant })))
  await database.insert(organizerBlockT).values({ organizerId: 'organizer', userId: 'available-0' })
  const results = await searchEventGuestUsersHandler(
    database,
    { eventId: 'event', query: 'A' },
    'viewer'
  )

  assert.equal(results.length, EVENT_GUEST_USER_SEARCH_LIMIT)
  assert.ok(!results.some((user) => user.id === 'available-0'))
  assert.ok(results.some((user) => user.id === 'cancelled'))
  assert.ok(!results.some((user) => user.id === 'confirmed'))
  assert.ok(!results.some((user) => user.id === 'waitlisted'))
  assert.ok(!results.some((user) => user.id === 'other-guest'))
  assert.ok(!results.some((user) => user.id === 'contains-only'))

  const ownGuestResults = await searchEventGuestUsersHandler(
    database,
    { eventId: 'event', query: 'Avery' },
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
    { eventId: 'event', query: '   ' }
  )

  assert.deepEqual(results, [])
})
