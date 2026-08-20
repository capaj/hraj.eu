import { createServerFn } from '@tanstack/react-start'
import { asc } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { isCurrentRequestAdmin } from './adminPermissions'

export type AdminEventBanUser = {
  id: string
  name: string
  email: string
  image: string | null
  eventJoinBannedUntil: Date | null
}

export const getAdminEventBanUsers = createServerFn({ method: 'GET' }).handler(
  async () => {
    if (!(await isCurrentRequestAdmin())) {
      return { isAdmin: false, users: [] as AdminEventBanUser[] }
    }

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        eventJoinBannedUntil: user.eventJoinBannedUntil
      })
      .from(user)
      .orderBy(asc(user.name), asc(user.email))

    return {
      isAdmin: true,
      users: users.map((entry) => ({
        ...entry,
        eventJoinBannedUntil: entry.eventJoinBannedUntil
          ? new Date(entry.eventJoinBannedUntil)
          : null
      })) satisfies AdminEventBanUser[]
    }
  }
)
