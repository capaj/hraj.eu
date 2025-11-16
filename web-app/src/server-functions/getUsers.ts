import { createServerFn } from '@tanstack/react-start'
import { User } from '../types'
import { db } from '../../drizzle/db'
import { user as userTable } from '../../drizzle/schema'

export const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const usersFromDb = await db.select().from(userTable)

  const users = usersFromDb.map((user) => ({
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
  })) as User[]

  return users
})
