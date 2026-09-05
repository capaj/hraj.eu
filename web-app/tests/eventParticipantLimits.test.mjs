import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeEventParticipantLimits } from '../src/utils/eventParticipantLimits.ts'

test('maximum player count cannot be less than two', () => {
  assert.deepEqual(
    normalizeEventParticipantLimits({
      minParticipants: 2,
      idealParticipants: 8,
      maxParticipants: 1
    }),
    {
      minParticipants: 2,
      idealParticipants: 2,
      maxParticipants: 2
    }
  )
})

test('a maximum of two constrains both slider values to two', () => {
  assert.deepEqual(
    normalizeEventParticipantLimits({
      minParticipants: 4,
      idealParticipants: 6,
      maxParticipants: 2
    }),
    {
      minParticipants: 2,
      idealParticipants: 2,
      maxParticipants: 2
    }
  )
})

test('participant limits stay ordered within the maximum', () => {
  assert.deepEqual(
    normalizeEventParticipantLimits({
      minParticipants: 7,
      idealParticipants: 4,
      maxParticipants: 10
    }),
    {
      minParticipants: 7,
      idealParticipants: 7,
      maxParticipants: 10
    }
  )
})
