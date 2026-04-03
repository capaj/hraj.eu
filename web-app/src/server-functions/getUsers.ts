import { createServerFn } from '@tanstack/react-start'
import { User } from '../types'
import { db } from '../../drizzle/db'
import { z } from 'zod'

export const getUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z
      .object({
        limit: z.number().int().positive().max(100).optional()
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => {
    const usersFromDb = await db.query.user.findMany({
      with: {
        skills: true
      },
      limit: data?.limit
    })

    const users = usersFromDb.map((user) => {
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
        notificationPreferences: {},
        preferredCurrency: user.preferredCurrency || 'CZK',
        location:
          user.city && user.country ? `${user.city}, ${user.country}` : undefined,
        revTag: user.revolutTag || undefined,
        bankAccount: user.bankAccount || undefined,
        createdAt: new Date(user.createdAt)
      } as User
    })

    return users
  })
