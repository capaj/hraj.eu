import { createServerFn } from '@tanstack/react-start'
import { User } from '../types'
import { db } from '../../drizzle/db'
import { user as userTable } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)

    if (!users || users.length === 0) {
      throw new Error(`User with id ${userId} not found`)
    }

    const user = users[0]

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
      karmaPoints: user.karmaPoints || 0,
      skillLevels: {},
      notificationPreferences: {},
      preferredCurrency: user.preferredCurrency || 'CZK',
      location:
        user.city && user.country ? `${user.city}, ${user.country}` : undefined,
      revTag: user.revolutTag || undefined,
      bankAccount: user.bankAccount || undefined,
      createdAt: new Date(user.createdAt)
    } as User
  })
