import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq, isNull, ne, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { auth } from '~/lib/auth'

function isValidTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone }).format(new Date())
    return true
  } catch {
    return false
  }
}

const UpdateUserTimezoneSchema = z.object({
  timezone: z.string().min(1).max(100).refine(isValidTimeZone)
})

export const updateUserTimezone = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    return UpdateUserTimezoneSchema.parse(payload)
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to update your timezone')
    }

    await db
      .update(user)
      .set({
        timezone: data.timezone,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(user.id, session.user.id),
          or(isNull(user.timezone), ne(user.timezone, data.timezone))
        )
      )

    return { success: true }
  })
