import { createServerFn } from '@tanstack/react-start'
import { User } from '../types'
import { db } from '../../drizzle/db'
import { eventT, user as userTable } from '../../drizzle/schema'
import { count, inArray } from 'drizzle-orm'

export const getUsersByIds = createServerFn({ method: 'GET' })
  .inputValidator((userIds: string[]) => userIds)
  .handler(async ({ data: userIds }) => {
    if (!userIds || userIds.length === 0) {
      return []
    }

    const usersFromDb = await db
      .select()
      .from(userTable)
      .where(inArray(userTable.id, userIds))

    const organizedCounts = await db
      .select({
        userId: eventT.organizerId,
        count: count()
      })
      .from(eventT)
      .where(inArray(eventT.organizerId, userIds))
      .groupBy(eventT.organizerId)

    const organizedCountByUserId = new Map(
      organizedCounts.map((result) => [result.userId, result.count])
    )

    const users = usersFromDb.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
      karmaPoints: user.karmaPoints || 0,
      eventsOrganized: organizedCountByUserId.get(user.id) ?? 0,
      skillLevels: {},
      notificationPreferences: {},
      preferredCurrency: user.preferredCurrency || 'CZK',
      location:
        user.city && user.country ? `${user.city}, ${user.country}` : undefined,
      revTag: user.revolutTag || undefined,
      bankAccount: user.bankAccount || undefined,
      createdAt: new Date(user.createdAt)
    })) as User[]

    return users
  })
