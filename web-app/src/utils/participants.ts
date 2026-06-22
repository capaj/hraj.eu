import { Event } from '~/types'

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
  return Math.max(event.maxParticipants - getTotalReservedAwareHeadcount(event), 0)
}
