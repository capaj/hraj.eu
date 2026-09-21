import test from 'node:test'
import assert from 'node:assert/strict'
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core'
import { getEventsHandler } from '../src/server-functions/getEventsHandler.ts'

async function captureEventQuery(data, viewerId, memberships = []) {
  let query
  const database = {
    select: (shape) => ({
      from: () => ({
        where: (condition) => {
          if (shape) return memberships
          query = new SQLiteSyncDialect().sqlToQuery(condition)
          return { orderBy: () => ({ limit: () => [] }) }
        }
      })
    })
  }
  await getEventsHandler(database, data, viewerId)
  return query
}

test('discovery requires public events even for signed-in core-group members', async () => {
  for (const viewerId of [undefined, 'viewer']) {
    const query = await captureEventQuery(undefined, viewerId, [{ coreGroupId: 'group' }])
    assert.match(query.sql, /"event"\."is_public" = \? and/)
    assert.ok(query.params.includes(1))
    assert.doesNotMatch(query.sql, /exists|"organizer_id"/)
  }
})

test('requesting own private events anonymously cannot bypass discovery privacy', async () => {
  const query = await captureEventQuery({ includeOwnPrivateEvents: true })
  assert.match(query.sql, /"event"\."is_public" = \?/)
  assert.doesNotMatch(query.sql, /exists|"organizer_id"/)
})

test('profile private-event access is restricted to the session user', async () => {
  const query = await captureEventQuery({ includeOwnPrivateEvents: true }, 'viewer')
  assert.match(query.sql, /"event"\."is_public" = \? and/)
  assert.match(query.sql, /or \("event"\."organizer_id" = \? or exists/)
  assert.match(query.sql, /"participant"\."event_id" = "event"\."id"/)
  assert.match(query.sql, /"participant"\."user_id" = \?/)
  assert.match(query.sql, /in \('confirmed', 'waitlisted', 'invited'\)/)
  assert.equal(query.params.filter(value => value === 'viewer').length, 2)
})

test('getEventsHandler applies SQL ordering and max limit 50', async () => {
  const { getEventsHandler } = await import('../src/server-functions/getEventsHandler.ts')

  const orderByCalls = []
  const limitCalls = []

  const eventRows = [
    {
      id: 'e1',
      title: 'Event 1',
      description: null,
      sport: 'football',
      venueId: 'v1',
      date: '2030-01-01',
      startTime: '10:00',
      duration: 60,
      minParticipants: 2,
      idealParticipants: null,
      maxParticipants: 10,
      cancellationDeadlineMinutes: 120,
      price: null,
      paymentDetails: null,
      gameRules: null,
      isPublic: true,
      organizerId: 'u1',
      requiredSkillLevel: null,
      status: 'open',
      qrCodeImages: [],
      createdAt: new Date('2029-01-01'),
      updatedAt: new Date('2029-01-01')
    }
  ]

  const fakeDb = {
    select: (shape) => {
      if (shape) {
        return {
          from: () => ({
            where: () => []
          })
        }
      }

      return {
        from: () => ({
          where: () => ({
            orderBy: (...args) => {
              orderByCalls.push(args)
              return {
                limit: (n) => {
                  limitCalls.push(n)
                  return eventRows
                }
              }
            }
          })
        })
      }
    }
  }

  const events = await getEventsHandler(fakeDb, undefined)

  assert.equal(orderByCalls.length, 1)
  assert.deepEqual(limitCalls, [50])
  assert.equal(events.length, 1)
  assert.equal(events[0].id, 'e1')
})
