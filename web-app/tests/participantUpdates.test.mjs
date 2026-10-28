import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyEventParticipantsUpdate,
  getAvailablePublicSpots,
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

test('pending bookings and their guests consume list capacity without confirming attendance', () => {
  const updatedEvent = applyEventParticipantsUpdate(
    { ...event, maxParticipants: 5 },
    {
      confirmed: ['organizer'],
      pendingPayment: ['joining-player'],
      waitlisted: ['waiting-player'],
      plusAttendees: { 'joining-player': ['Guest'] },
      guests: { 'joining-player': [{ name: 'Guest' }] },
      participantJoinedAt: { organizer: new Date('2026-10-01') },
      waitlistJoinedAt: { 'waiting-player': new Date('2026-10-02') }
    }
  )

  assert.deepEqual(updatedEvent.pendingPayment, ['joining-player'])
  assert.deepEqual(updatedEvent.participantGuests['joining-player'], [
    { name: 'Guest' }
  ])
  assert.equal(getAvailablePublicSpots(updatedEvent), 1)
  assert.equal(getTotalReservedAwareHeadcount(updatedEvent), 2)
})

test('confirmed updates clear a previously pending booking without double-counting capacity', () => {
  const updatedEvent = applyEventParticipantsUpdate(
    {
      ...event,
      maxParticipants: 4,
      pendingPayment: ['joining-player']
    },
    {
      confirmed: ['organizer', 'joining-player'],
      pendingPayment: [],
      waitlisted: [],
      plusAttendees: {},
      participantJoinedAt: {},
      waitlistJoinedAt: {}
    }
  )
  assert.deepEqual(updatedEvent.pendingPayment, [])
  assert.equal(getAvailablePublicSpots(updatedEvent), 1)
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
