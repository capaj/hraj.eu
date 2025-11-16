import { createServerFn } from '@tanstack/react-start'
import { db } from '../../drizzle/db'
import { eventT, participantT, venueT } from '../../drizzle/schema'
import { eq, count, sql } from 'drizzle-orm'

export const getAppStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [eventsCountResult] = await db.select({ count: count() }).from(eventT)

    const [activeUsersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${participantT.userId})` })
      .from(participantT)
      .where(eq(participantT.status, 'confirmed'))

    const [countriesResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${venueT.country})` })
      .from(venueT)
      .where(sql`${venueT.country} IS NOT NULL`)

    const [completedEventsResult] = await db
      .select({ count: count() })
      .from(eventT)
      .where(eq(eventT.status, 'completed'))

    const [cancelledEventsResult] = await db
      .select({ count: count() })
      .from(eventT)
      .where(eq(eventT.status, 'cancelled'))

    const eventsCreated = eventsCountResult?.count || 0
    const activeUsers = Number(activeUsersResult?.count) || 0
    const countries = Number(countriesResult?.count) || 0

    const completedEvents = completedEventsResult?.count || 0
    const cancelledEvents = cancelledEventsResult?.count || 0
    const totalFinishedEvents = completedEvents + cancelledEvents
    const successRate =
      totalFinishedEvents > 0
        ? Math.round((completedEvents / totalFinishedEvents) * 100)
        : 0

    return {
      eventsCreated,
      activeUsers,
      countries,
      successRate
    }
  }
)
