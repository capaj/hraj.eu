import { coreGroupMemberT, eventStatuses, eventT, participantT } from '../../drizzle/schema'
import { and, eq, inArray, isNull, lte, not, or, sql } from 'drizzle-orm'

export type GetEventsInput = {
  statuses?: Array<(typeof eventStatuses)[number]>
  pastEventsLimit?: number
}

export async function getEventsHandler(
  db: any,
  data?: GetEventsInput,
  viewerId?: string
): Promise<any[]> {
  const statuses = data?.statuses

  const eventDateTimeSql = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime})`

  const memberCoreGroupIds = viewerId
    ? (
        await db
          .select({ coreGroupId: coreGroupMemberT.coreGroupId })
          .from(coreGroupMemberT)
          .where(eq(coreGroupMemberT.userId, viewerId))
      ).map((membership: any) => membership.coreGroupId)
    : []

  const visibilityClause =
    memberCoreGroupIds.length > 0
      ? or(
          isNull(eventT.coreGroupExclusiveUntil),
          lte(eventT.coreGroupExclusiveUntil, new Date()),
          inArray(eventT.coreGroupId, memberCoreGroupIds)
        )
      : or(
          isNull(eventT.coreGroupExclusiveUntil),
          lte(eventT.coreGroupExclusiveUntil, new Date())
        )

  const baseWhereClause = and(
    statuses && statuses.length > 0
      ? inArray(eventT.status, statuses)
      : not(eq(eventT.status, 'cancelled')),
    visibilityClause
  )

  const pastEventsLimit = data?.pastEventsLimit

  const eventsFromDb =
    pastEventsLimit && pastEventsLimit > 0
      ? await db
          .select()
          .from(eventT)
          .where(
            and(
              baseWhereClause,
              or(
                sql`${eventDateTimeSql} >= datetime('now')`,
                inArray(
                  eventT.id,
                  db
                    .select({ id: eventT.id })
                    .from(eventT)
                    .where(and(baseWhereClause, sql`${eventDateTimeSql} < datetime('now')`))
                    .orderBy(sql`${eventDateTimeSql} DESC`)
                    .limit(pastEventsLimit)
                )
              )
            )
          )
          .orderBy(
            sql`CASE WHEN ${eventDateTimeSql} < datetime('now') THEN 1 ELSE 0 END`,
            sql`CASE WHEN ${eventDateTimeSql} >= datetime('now') THEN ${eventDateTimeSql} END ASC`,
            sql`CASE WHEN ${eventDateTimeSql} < datetime('now') THEN ${eventDateTimeSql} END DESC`
          )
          .limit(50 + pastEventsLimit)
      : await db
          .select()
          .from(eventT)
          .where(baseWhereClause)
          .orderBy(
            sql`CASE WHEN ${eventDateTimeSql} < datetime('now') THEN 1 ELSE 0 END`,
            sql`CASE WHEN ${eventDateTimeSql} >= datetime('now') THEN ${eventDateTimeSql} END ASC`,
            sql`CASE WHEN ${eventDateTimeSql} < datetime('now') THEN ${eventDateTimeSql} END DESC`
          )
          .limit(50)

  const eventsWithParticipants = await Promise.all(
    eventsFromDb.map(async (event: any) => {
      const participants = await db
        .select({
          userId: participantT.userId,
          status: participantT.status,
          plusAttendees: participantT.plusAttendees
        })
        .from(participantT)
        .where(eq(participantT.eventId, event.id))

      const confirmedParticipants = participants
        .filter((p: any) => p.status === 'confirmed')
        .map((p: any) => p.userId)

      const waitlistedParticipants = participants
        .filter((p: any) => p.status === 'waitlisted')
        .map((p: any) => p.userId)

      const participantPlusOnes = participants.reduce(
        (acc: Record<string, string[]>, participant: any) => {
          acc[participant.userId] = participant.plusAttendees || []
          return acc
        },
        {}
      )

      return {
        id: event.id,
        title: event.title,
        description: event.description || '',
        sport: event.sport,
        venueId: event.venueId || '',
        date: new Date(event.date),
        startTime: event.startTime,
        duration: event.duration,
        minParticipants: event.minParticipants,
        idealParticipants: event.idealParticipants || undefined,
        maxParticipants: event.maxParticipants,
        cancellationDeadlineHours: event.cancellationDeadlineMinutes
          ? Math.floor(event.cancellationDeadlineMinutes / 60)
          : undefined,
        price: event.price || undefined,
        paymentDetails: event.paymentDetails || undefined,
        gameRules: event.gameRules || undefined,
        cutoffTime: new Date(
          new Date(event.date).getTime() -
            (event.cancellationDeadlineMinutes || 0) * 60 * 1000
        ),
        isPublic: event.isPublic,
        organizerId: event.organizerId,
        participants: confirmedParticipants,
        waitlist: waitlistedParticipants,
        participantPlusOnes,
        status: event.status,
        allowedSkillLevels: event.requiredSkillLevel
          ? [event.requiredSkillLevel]
          : undefined,
        requireSkillLevel: !!event.requiredSkillLevel,
        qrCodeImages: event.qrCodeImages || [],
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      }
    })
  )

  return eventsWithParticipants
}
