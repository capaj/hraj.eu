import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyEventParticipantsUpdate,
  getTotalReservedAwareHeadcount
} from '../src/utils/participants.ts'

const event = {
  participants: ['organizer'],
  waitlist: [],
  participantPlusOnes: {},
  participantGuests: {},
  participantJoinedAt: {},
  waitlistJoinedAt: {},
  reservedParticipants: 1
}

test('updates the displayed headcount immediately after joining', () => {
  const updatedEvent = applyEventParticipantsUpdate(event, {
    confirmed: ['organizer', 'joining-player'],
    waitlisted: [],
    plusAttendees: {},
    guests: {},
    participantJoinedAt: {},
    waitlistJoinedAt: {}
  })

  assert.equal(getTotalReservedAwareHeadcount(updatedEvent), 3)
})

test('updates the displayed headcount immediately after leaving', () => {
  const updatedEvent = applyEventParticipantsUpdate(
    {
      ...event,
      participants: ['organizer', 'leaving-player']
    },
    {
      confirmed: ['organizer'],
      waitlisted: [],
      plusAttendees: {},
      participantJoinedAt: {},
      waitlistJoinedAt: {}
    }
  )

  assert.equal(getTotalReservedAwareHeadcount(updatedEvent), 2)
})
