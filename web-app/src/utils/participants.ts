import type { Event } from '~/types'

export interface EventParticipantsUpdate {
  pendingPayment?: string[]
  confirmed: string[]
  waitlisted: string[]
  plusAttendees: Record<string, string[]>
  guests?: NonNullable<Event['participantGuests']>
  participantJoinedAt: Record<string, Date>
  waitlistJoinedAt: Record<string, Date>
}

export function applyEventParticipantsUpdate(
  event: Event,
  participants: EventParticipantsUpdate
): Event {
  return {
    ...event,
    participants: participants.confirmed,
    pendingPayment: participants.pendingPayment ?? [],
    waitlist: participants.waitlisted,
    participantPlusOnes: participants.plusAttendees,
    participantGuests: participants.guests ?? event.participantGuests,
    participantJoinedAt: participants.participantJoinedAt,
    waitlistJoinedAt: participants.waitlistJoinedAt
  }
}

export function getMentionableParticipantIds(
  event: Pick<
    Event,
    'participants' | 'waitlist' | 'formerParticipants' | 'pendingPayment'
  >
): string[] {
  return Array.from(
    new Set([
      ...event.participants,
      ...(event.pendingPayment ?? []),
      ...(event.waitlist || []),
      ...(event.formerParticipants || [])
    ])
  )
}

export function getParticipantPlusOnes(event: Event): Record<string, string[]> {
  return event.participantPlusOnes || {}
}

export function getConfirmedHeadcount(event: Event): number {
  const plusAttendees = getParticipantPlusOnes(event)

  return event.participants.reduce((total, userId) => {
    const extras = plusAttendees[userId]?.length ?? 0
    return total + 1 + extras
  }, 0)
}

export function getReservedParticipants(event: Event): number {
  return event.reservedParticipants ?? 0
}

export function getTotalReservedAwareHeadcount(event: Event): number {
  return getConfirmedHeadcount(event) + getReservedParticipants(event)
}

export function getAvailablePublicSpots(event: Event): number {
  const pending = (event.pendingPayment ?? []).reduce(
    (sum, id) => sum + 1 + (event.participantPlusOnes?.[id]?.length ?? 0),
    0
  )
  return Math.max(
    event.maxParticipants - getTotalReservedAwareHeadcount(event) - pending,
    0
  )
}
