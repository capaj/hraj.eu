import type { Event } from '../types'
import { getTotalReservedAwareHeadcount } from './participants'

export function getEventPlayerGauge(event: Event) {
  const count = getTotalReservedAwareHeadcount(event)
  const ideal = event.idealParticipants ?? event.minParticipants
  let status: 'full' | 'ideal' | 'too-few' = 'too-few'
  if (count >= event.maxParticipants) {
    status = 'full'
  } else if (count >= ideal) {
    status = 'ideal'
  }

  return {
    count,
    status,
    // Keep the ring within its bounds even if an event becomes overbooked.
    progress: event.maxParticipants > 0
      ? Math.min(1, Math.max(0, count / event.maxParticipants))
      : 0
  }
}
