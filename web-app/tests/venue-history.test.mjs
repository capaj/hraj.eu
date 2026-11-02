import test from 'node:test'
import assert from 'node:assert/strict'
import { createPaymentTestDatabase } from './fioPglite.mjs'
import { eventT } from '../drizzle/schema.ts'
import { queryVenueHistory } from '../src/server-functions/venueHistory.ts'

test('Venue history filters private, draft, future, exclusive and other-venue events and paginates all public history', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  const now = new Date('2026-10-22T17:30:00Z') // 19:30 in Prague
  const base = {
    venueId: 'venue',
    sport: 'volleyball',
    date: '2026-10-01',
    startTime: '18:00',
    duration: 90,
    minParticipants: 2,
    maxParticipants: 12,
    cancellationDeadlineMinutes: 120,
    organizerId: 'organizer',
    isPublic: true,
    status: 'completed'
  }
  await database
    .insert(eventT)
    .values([
      ...Array.from({ length: 23 }, (_, index) => ({
        ...base,
        id: `past-${String(index).padStart(2, '0')}`,
        title: `Past ${index}`
      })),
      {
        ...base,
        id: 'cancelled',
        title: 'Cancelled',
        status: 'cancelled',
        date: '2026-10-21'
      },
      {
        ...base,
        id: 'today-past',
        title: 'Earlier today',
        date: '2026-10-22',
        startTime: '19:00',
        status: 'confirmed'
      },
      {
        ...base,
        id: 'today-future',
        title: 'Later today',
        date: '2026-10-22',
        startTime: '20:00'
      },
      { ...base, id: 'future', title: 'Future', date: '2026-11-01' },
      { ...base, id: 'private', title: 'Private', isPublic: false },
      { ...base, id: 'draft', title: 'Draft', status: 'draft' },
      { ...base, id: 'other', title: 'Other venue', venueId: 'other' },
      {
        ...base,
        id: 'exclusive',
        title: 'Exclusive',
        coreGroupExclusiveUntil: new Date('2026-11-01')
      }
    ])
  const first = await queryVenueHistory(database, 'venue', 1, now)
  const second = await queryVenueHistory(database, 'venue', 2, now)
  assert.equal(first.total, 25)
  assert.equal(first.events.length, 20)
  assert.equal(second.events.length, 5)
  assert.deepEqual(
    first.events.slice(0, 2).map((event) => event.id),
    ['today-past', 'cancelled']
  )
  assert.equal(
    new Set([...first.events, ...second.events].map((event) => event.id)).size,
    25
  )
  assert.equal('participants' in first.events[0], false)
  assert.deepEqual(await queryVenueHistory(database, 'missing', 1, now), {
    events: [],
    total: 0,
    page: 1
  })
})
