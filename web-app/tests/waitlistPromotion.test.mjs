import test from 'node:test'
import assert from 'node:assert/strict'
import { getWaitlistParticipantIdsToPromote } from '../src/server-functions/waitlistPromotion.ts'

test('promotes waitlisted participants in FIFO order up to available capacity', () => {
  const participants = [
    { id: 1, status: 'confirmed', plusAttendees: ['Guest'] },
    { id: 2, status: 'confirmed', plusAttendees: [] },
    { id: 3, status: 'waitlisted', plusAttendees: ['Guest'] },
    { id: 4, status: 'waitlisted', plusAttendees: [] }
  ]

  assert.deepEqual(
    getWaitlistParticipantIdsToPromote(participants, 6, 1),
    [3]
  )
})

test('does not skip a waitlisted group that is too large for the next spot', () => {
  const participants = [
    { id: 1, status: 'confirmed', plusAttendees: [] },
    { id: 2, status: 'confirmed', plusAttendees: [] },
    { id: 3, status: 'waitlisted', plusAttendees: ['Guest'] },
    { id: 4, status: 'waitlisted', plusAttendees: [] }
  ]

  assert.deepEqual(
    getWaitlistParticipantIdsToPromote(participants, 3, 0),
    []
  )
})
