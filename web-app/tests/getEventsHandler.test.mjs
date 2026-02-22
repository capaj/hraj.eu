import test from 'node:test'
import assert from 'node:assert/strict'

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
