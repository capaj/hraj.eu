import test from 'node:test'
import assert from 'node:assert/strict'

test('addEarnedKarma applies the karma rules to stored points', async () => {
  const { addEarnedKarma } = await import('../src/server-functions/karma.ts')

  const users = [
    { id: 'organizer', karmaPoints: 3 },
    { id: 'player', karmaPoints: -5 },
    { id: 'inactive', karmaPoints: 2 }
  ]

  const result = addEarnedKarma(
    users,
    [{ userId: 'organizer', points: 20 }],
    [
      { userId: 'organizer', points: 5 },
      { userId: 'player', points: 10 }
    ]
  )

  assert.deepEqual(
    result.map(({ id, karmaPoints }) => ({ id, karmaPoints })),
    [
      { id: 'organizer', karmaPoints: 28 },
      { id: 'player', karmaPoints: 5 },
      { id: 'inactive', karmaPoints: 2 }
    ]
  )
})
