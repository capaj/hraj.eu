import { and, eq, sql } from 'drizzle-orm'
import type { AnySQLiteColumn, BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { eventT, organizerBlockT } from '../../drizzle/schema'
import { ORGANIZER_BLOCKED_MESSAGE } from '../lib/organizerBlocks'

type ReadDatabase = Pick<BaseSQLiteDatabase<'async', unknown>, 'select'>

// Use in the outer WHERE clause, before pagination and alongside all other
// visibility rules. Membership and existing bookings never override a block.
export function eventsVisibleToUser(viewerId?: string | AnySQLiteColumn) {
  if (!viewerId) return undefined
  return sql`not exists (select 1 from ${organizerBlockT}
    where ${organizerBlockT.organizerId} = ${eventT.organizerId}
    and ${organizerBlockT.userId} = ${viewerId})`
}

export async function assertOrganizerHasNotBlocked(
  database: ReadDatabase,
  organizerId: string,
  viewerId?: string
) {
  if (!viewerId) return
  const [block] = await database
    .select({ id: organizerBlockT.id })
    .from(organizerBlockT)
    .where(and(
      eq(organizerBlockT.organizerId, organizerId),
      eq(organizerBlockT.userId, viewerId)
    ))
    .limit(1)
  if (block) throw new Error(ORGANIZER_BLOCKED_MESSAGE)
}

export async function assertEventAccess(
  database: ReadDatabase,
  eventId: string,
  viewerId?: string
) {
  const [event] = await database
    .select({ organizerId: eventT.organizerId })
    .from(eventT)
    .where(eq(eventT.id, eventId))
    .limit(1)
  if (!event) throw new Error('Event not found')
  await assertOrganizerHasNotBlocked(database, event.organizerId, viewerId)
  return event
}
