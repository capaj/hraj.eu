import test from 'node:test'
import assert from 'node:assert/strict'
import { getMentionableParticipantIds } from '../src/utils/participants.ts'

test('includes former participants in event mention candidates', () => {
  assert.deepEqual(
    getMentionableParticipantIds({
      participants: ['confirmed'],
      waitlist: ['waitlisted'],
      formerParticipants: ['left']
    }),
    ['confirmed', 'waitlisted', 'left']
  )
})

test('does not duplicate a former participant who rejoined', () => {
  assert.deepEqual(
    getMentionableParticipantIds({
      participants: ['rejoined'],
      waitlist: [],
      formerParticipants: ['rejoined']
    }),
    ['rejoined']
  )
})
