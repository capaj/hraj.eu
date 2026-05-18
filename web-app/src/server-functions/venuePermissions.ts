import { and, eq, inArray, not, or, sql } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { eventT, participantT, user, venueT } from '../../drizzle/schema'

const ADMIN_EMAILS = ['capajj@gmail.com']

type VenuePermissionTarget = {
  id: string
  createdBy: string | null
}

const pastEventSql = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime}) < datetime('now')`
const confirmedHeadcountSql = sql<number>`cast(coalesce(sum(1 + json_array_length(${participantT.plusAttendees})), 0) as int)`

export async function isVenueAdmin(userId: string) {
  const userData = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      email: true
    }
  })

  return !!userData?.email && ADMIN_EMAILS.includes(userData.email)
}

export async function getSuccessfulOrganizerVenueIds(userId: string) {
  const rows = await db
    .select({ venueId: eventT.venueId })
    .from(eventT)
    .innerJoin(
      participantT,
      and(
        eq(participantT.eventId, eventT.id),
        eq(participantT.status, 'confirmed')
      )
    )
    .where(
      and(
        eq(eventT.organizerId, userId),
        not(eq(eventT.status, 'cancelled')),
        sql`${eventT.venueId} is not null`,
        pastEventSql
      )
    )
    .groupBy(eventT.id)
    .having(sql`${confirmedHeadcountSql} >= ${eventT.minParticipants}`)

  return Array.from(
    new Set(rows.map((row) => row.venueId).filter((id): id is string => !!id))
  )
}

export async function hasOrganizedSuccessfulEventAtVenue(
  userId: string,
  venueId: string
) {
  const rows = await db
    .select({ id: eventT.id })
    .from(eventT)
    .innerJoin(
      participantT,
      and(
        eq(participantT.eventId, eventT.id),
        eq(participantT.status, 'confirmed')
      )
    )
    .where(
      and(
        eq(eventT.organizerId, userId),
        eq(eventT.venueId, venueId),
        not(eq(eventT.status, 'cancelled')),
        pastEventSql
      )
    )
    .groupBy(eventT.id)
    .having(sql`${confirmedHeadcountSql} >= ${eventT.minParticipants}`)
    .limit(1)

  return rows.length > 0
}

export async function canEditVenue(
  userId: string,
  venue: VenuePermissionTarget
) {
  if (venue.createdBy === userId) return true
  if (await isVenueAdmin(userId)) return true

  return hasOrganizedSuccessfulEventAtVenue(userId, venue.id)
}

export function editableVenueWhereClause(userId: string, venueIds: string[]) {
  return venueIds.length > 0
    ? or(eq(venueT.createdBy, userId), inArray(venueT.id, venueIds))
    : eq(venueT.createdBy, userId)
}
