import { inArray } from 'drizzle-orm'
import { user } from '../../drizzle/schema'
import {
  normalizeEventGuests,
  type EventGuest,
  type StoredEventGuest
} from '../lib/eventGuests'

type EventParticipantWithGuests = {
  userId: string
  status: string
  plusAttendees: StoredEventGuest[] | null
}

const ACTIVE_PARTICIPANT_STATUSES = new Set(['confirmed', 'waitlisted'])

export async function validateEventGuests(
  db: any,
  guests: readonly StoredEventGuest[],
  participants: readonly EventParticipantWithGuests[],
  ownerUserId: string
): Promise<EventGuest[]> {
  const normalizedGuests = normalizeEventGuests(guests)
  const referencedUserIds = normalizedGuests.flatMap((guest) =>
    guest.userId ? [guest.userId] : []
  )

  if (new Set(referencedUserIds).size !== referencedUserIds.length) {
    throw new Error('The same player cannot be added as a guest more than once.')
  }

  if (!referencedUserIds.length) return normalizedGuests

  const unavailableUserIds = new Set<string>()
  for (const participant of participants) {
    if (ACTIVE_PARTICIPANT_STATUSES.has(participant.status)) {
      unavailableUserIds.add(participant.userId)
    }

    if (participant.userId !== ownerUserId) {
      for (const guest of normalizeEventGuests(participant.plusAttendees)) {
        if (guest.userId) unavailableUserIds.add(guest.userId)
      }
    }
  }

  if (referencedUserIds.some((userId) => unavailableUserIds.has(userId))) {
    throw new Error('One of the selected players is already in this event.')
  }

  const referencedUsers: Array<{ id: string; name: string }> = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, referencedUserIds))

  const usersById = new Map(
    referencedUsers.map((referencedUser) => [referencedUser.id, referencedUser])
  )

  if (usersById.size !== referencedUserIds.length) {
    throw new Error('One of the selected players no longer exists.')
  }

  return normalizedGuests.map((guest) => {
    if (!guest.userId) return guest

    return {
      name: usersById.get(guest.userId)!.name,
      userId: guest.userId
    }
  })
}
