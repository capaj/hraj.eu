import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeEventGuests } from '../src/lib/eventGuests.ts'

test('normalizes legacy names and keeps direct user references', () => {
  assert.deepEqual(
    normalizeEventGuests([
      '  Free-form guest  ',
      { name: ' Linked Player ', userId: ' player-1 ' },
      '   '
    ]),
    [
      { name: 'Free-form guest' },
      { name: 'Linked Player', userId: 'player-1' }
    ]
  )
})
