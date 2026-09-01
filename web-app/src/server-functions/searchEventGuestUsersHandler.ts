import { and, asc, eq, notInArray, sql } from 'drizzle-orm'
import { participantT, user } from '../../drizzle/schema'
import { normalizeEventGuests } from '../lib/eventGuests'

export const EVENT_GUEST_USER_SEARCH_LIMIT = 20

export type EventGuestUserSearchResult = {
  id: string
  name: string
  image: string | null
}

const ACTIVE_PARTICIPANT_STATUSES = new Set(['confirmed', 'waitlisted'])

export async function searchEventGuestUsersHandler(
  db: any,
  input: { eventId: string; query: string },
  viewerId?: string
): Promise<EventGuestUserSearchResult[]> {
  const query = input.query.trim()
  if (!query) return []

  const eventParticipants = await db
    .select({
      userId: participantT.userId,
      status: participantT.status,
      plusAttendees: participantT.plusAttendees
    })
    .from(participantT)
    .where(eq(participantT.eventId, input.eventId))

  const excludedUserIds = new Set<string>()

  for (const participant of eventParticipants) {
    if (ACTIVE_PARTICIPANT_STATUSES.has(participant.status)) {
      excludedUserIds.add(participant.userId)
    }

    // A referenced guest is already represented in the event too. Ignore the
    // current viewer's own guest slots so editing an existing selection works.
    if (participant.userId !== viewerId) {
      for (const guest of normalizeEventGuests(participant.plusAttendees)) {
        if (guest.userId) excludedUserIds.add(guest.userId)
      }
    }
  }

  const normalizedQuery = query.toLowerCase()
  const nameMatches = sql`instr(lower(${user.name}), ${normalizedQuery}) > 0`
  const whereClause = excludedUserIds.size
    ? and(nameMatches, notInArray(user.id, [...excludedUserIds]))
    : nameMatches

  return db
    .select({
      id: user.id,
      name: user.name,
      image: user.image
    })
    .from(user)
    .where(whereClause)
    .orderBy(
      sql`CASE WHEN instr(lower(${user.name}), ${normalizedQuery}) = 1 THEN 0 ELSE 1 END`,
      asc(user.name),
      asc(user.id)
    )
    .limit(EVENT_GUEST_USER_SEARCH_LIMIT)
}
