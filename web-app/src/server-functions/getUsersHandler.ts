import { and, eq, ne, sql } from 'drizzle-orm'
import { eventT, participantT } from '../../drizzle/schema'
import type { User } from '../types'
import { addEarnedKarma } from './karma'

type GetUsersInput = {
  limit?: number
  sport?: string
}

export async function getUsersHandler(db: any, input?: GetUsersInput) {
  const usersFromDb = await db.query.user.findMany({
    with: {
      skills: true
    }
  })

  // An event counts once it has taken place. Cancelled events must never award
  // karma, even if they still have confirmed participant rows.
  const pastEventClause = and(
    ne(eventT.status, 'cancelled'),
    sql`datetime(${eventT.date} || ' ' || ${eventT.startTime}) < datetime('now')`,
    input?.sport ? eq(eventT.sport, input.sport) : undefined
  )

  const organized: Array<{ userId: string; points: number }> = await db
    .select({
      userId: eventT.organizerId,
      points: sql<number>`count(*) * 10`
    })
    .from(eventT)
    .where(pastEventClause)
    .groupBy(eventT.organizerId)

  const attended: Array<{ userId: string; points: number }> = await db
    .select({
      userId: participantT.userId,
      points: sql<number>`count(*) * 5`
    })
    .from(participantT)
    .innerJoin(eventT, eq(participantT.eventId, eventT.id))
    .where(and(eq(participantT.status, 'confirmed'), pastEventClause))
    .groupBy(participantT.userId)

  const users = usersFromDb.map((currentUser: any) => {
    const skillLevels: User['skillLevels'] = {}
    for (const skill of currentUser.skills ?? []) {
      skillLevels[skill.sport] = skill.skillLevel
    }

    return {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      image: currentUser.image || undefined,
      // Stored points cover feedback and manual adjustments. Event points are
      // derived below so existing events do not require a data migration.
      karmaPoints: input?.sport ? 0 : currentUser.karmaPoints || 0,
      skillLevels,
      notificationPreferences: {},
      preferredCurrency: currentUser.preferredCurrency || 'CZK',
      location:
        currentUser.city && currentUser.country
          ? `${currentUser.city}, ${currentUser.country}`
          : undefined,
      revTag: currentUser.revolutTag || undefined,
      bankAccount: currentUser.bankAccount || undefined,
      createdAt: new Date(currentUser.createdAt)
    } as User
  })

  return addEarnedKarma(users, organized, attended)
    .filter((currentUser) => !input?.sport || currentUser.skillLevels[input.sport])
    .sort((a, b) => b.karmaPoints - a.karmaPoints)
    .slice(0, input?.limit)
}
