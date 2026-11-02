import { and, count, desc, eq, inArray, isNull, lt, lte, or } from 'drizzle-orm'
import { eventT } from '../../drizzle/schema'
import type { db as database } from '../../drizzle/db'
import { VENUE_HISTORY_PAGE_SIZE } from '../lib/venueHistory'

// Public summaries do not need participant or payment data.
export async function queryVenueHistory(
  db: Pick<typeof database, 'select'>,
  venueId: string,
  page: number,
  now = new Date()
) {
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(now)
  const [date, time] = local.split(' ')
  const visibleHistory = and(
    eq(eventT.venueId, venueId),
    eq(eventT.isPublic, true),
    inArray(eventT.status, ['open', 'confirmed', 'completed', 'cancelled']),
    or(
      isNull(eventT.coreGroupExclusiveUntil),
      lte(eventT.coreGroupExclusiveUntil, now)
    ),
    or(
      lt(eventT.date, date),
      and(eq(eventT.date, date), lte(eventT.startTime, time))
    )
  )
  const [events, totals] = await Promise.all([
    db
      .select({
        id: eventT.id,
        title: eventT.title,
        sport: eventT.sport,
        date: eventT.date,
        startTime: eventT.startTime,
        duration: eventT.duration,
        status: eventT.status
      })
      .from(eventT)
      .where(visibleHistory)
      .orderBy(desc(eventT.date), desc(eventT.startTime), desc(eventT.id))
      .limit(VENUE_HISTORY_PAGE_SIZE)
      .offset((page - 1) * VENUE_HISTORY_PAGE_SIZE),
    db.select({ count: count() }).from(eventT).where(visibleHistory)
  ])
  return { events, total: totals[0].count, page }
}

export type VenueHistory = Awaited<ReturnType<typeof queryVenueHistory>>
