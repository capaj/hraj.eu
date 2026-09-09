import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canViewEventParticipantPhones,
  getConfirmedParticipantIds
} from '../src/utils/eventParticipantPhones.ts'

const participants = [
  { userId: 'confirmed-user', status: 'confirmed' },
  { userId: 'waitlisted-user', status: 'waitlisted' }
]

test('organizers and confirmed attendees can view attendee phone numbers', () => {
  assert.equal(
    canViewEventParticipantPhones('organizer', 'organizer', participants),
    true
  )
  assert.equal(
    canViewEventParticipantPhones('confirmed-user', 'organizer', participants),
    true
  )
})

test('anonymous, waitlisted, and unrelated users cannot view phone numbers', () => {
  assert.equal(
    canViewEventParticipantPhones(undefined, 'organizer', participants),
    false
  )
  assert.equal(
    canViewEventParticipantPhones('waitlisted-user', 'organizer', participants),
    false
  )
  assert.equal(
    canViewEventParticipantPhones('other-user', 'organizer', participants),
    false
  )
})

test('only confirmed participant ids are selected for phone disclosure', () => {
  assert.deepEqual(getConfirmedParticipantIds(participants), ['confirmed-user'])
})
