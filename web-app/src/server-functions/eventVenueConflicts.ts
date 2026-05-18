import { and, eq, not, sql } from 'drizzle-orm'
import { eventT } from '../../drizzle/schema'

type VenueEventConflictInput = {
  venueId: string | null | undefined
  date: string
  startTime: string
  duration: number
  excludeEventId?: string
}

type ConflictingEvent = {
  id: string
  title: string
  date: string
  startTime: string
  duration: number
}

export async function assertNoVenueEventConflict(
  database: any,
  {
    venueId,
    date,
    startTime,
    duration,
    excludeEventId
  }: VenueEventConflictInput
): Promise<void> {
  if (!venueId) {
    return
  }

  const requestedStart = `${date} ${startTime}`
  const requestedDurationModifier = `+${duration} minutes`
  const existingStartSql = sql`datetime(${eventT.date} || ' ' || ${
    eventT.startTime
  })`
  const existingEndSql = sql`datetime(${eventT.date} || ' ' || ${
    eventT.startTime
  }, '+' || ${eventT.duration} || ' minutes')`
  const requestedStartSql = sql`datetime(${requestedStart})`
  const requestedEndSql = sql`datetime(${requestedStart}, ${requestedDurationModifier})`

  const whereClauses = [
    eq(eventT.venueId, venueId),
    not(eq(eventT.status, 'cancelled')),
    sql`${existingStartSql} < ${requestedEndSql}`,
    sql`${existingEndSql} > ${requestedStartSql}`
  ]

  if (excludeEventId) {
    whereClauses.push(not(eq(eventT.id, excludeEventId)))
  }

  const [conflict]: ConflictingEvent[] = await database
    .select({
      id: eventT.id,
      title: eventT.title,
      date: eventT.date,
      startTime: eventT.startTime,
      duration: eventT.duration
    })
    .from(eventT)
    .where(and(...whereClauses))
    .limit(1)

  if (conflict) {
    const conflictDescription = `${conflict.title} on ${conflict.date} at ${conflict.startTime} (${conflict.duration} min).`

    throw new Error(
      `This venue already has an event at that time: ${conflictDescription}`
    )
  }
}
