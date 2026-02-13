import { createServerFn } from '@tanstack/react-start'
import { User } from '../types'
import { db } from '../../drizzle/db'
import { user as userTable } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const user = await db.query.user.findFirst({
      where: eq(userTable.id, userId),
      with: {
        skills: true
      }
    })

    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    const skillLevels: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {}
    if (user.skills) {
      for (const skill of user.skills) {
        skillLevels[skill.sport] = skill.skillLevel as
          | 'beginner'
          | 'intermediate'
          | 'advanced'
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
      karmaPoints: user.karmaPoints || 0,
      skillLevels,
      notificationPreferences: user.notificationPreferences ?? {},
      emailNotificationsDisabled: user.emailNotificationsDisabled ?? false,
      preferredCurrency: user.preferredCurrency || 'CZK',
      location:
        user.city && user.country ? `${user.city}, ${user.country}` : undefined,
      revTag: user.revolutTag || undefined,
      bankAccount: user.bankAccount || undefined,
      createdAt: new Date(user.createdAt)
    } as User
  })
