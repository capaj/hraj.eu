import test from 'node:test'
import assert from 'node:assert/strict'
import { getEventPlayerGauge } from '../src/utils/eventPlayerGauge.ts'

const event = {
  minParticipants: 4,
  idealParticipants: 8,
  maxParticipants: 10,
  participants: [],
  participantPlusOnes: {},
  waitlist: ['waiting-player']
}

test('gauge changes at ideal and maximum, and caps overbooked progress', () => {
  for (const [count, status, progress] of [
    [0, 'too-few', 0],
    [7, 'too-few', 0.7],
    [8, 'ideal', 0.8],
    [9, 'ideal', 0.9],
    [10, 'full', 1],
    [11, 'full', 1]
  ]) {
    assert.deepEqual(getEventPlayerGauge({
      ...event,
      participants: Array.from({ length: count }, (_, index) => `player-${index}`)
    }), { count, status, progress })
  }
})

test('gauge includes confirmed guests and reservations but excludes the waitlist', () => {
  assert.deepEqual(getEventPlayerGauge({
    ...event,
    participants: ['host'],
    participantPlusOnes: { host: ['Guest'], 'waiting-player': ['Waiting guest'] },
    reservedParticipants: 6
  }), { count: 8, status: 'ideal', progress: 0.8 })
})

test('events without an ideal use the minimum, with full taking precedence', () => {
  assert.equal(getEventPlayerGauge({
    ...event, idealParticipants: undefined, reservedParticipants: 4
  }).status, 'ideal')
  assert.equal(getEventPlayerGauge({
    ...event, idealParticipants: 10, reservedParticipants: 10
  }).status, 'full')
})
