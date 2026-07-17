import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { auth } from '~/lib/auth'

export const getCurrentUserEmailPreferences = createServerFn({
  method: 'GET'
}).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.id) {
    throw new Error('You must be signed in to view your email preferences')
  }

  const [preferences] = await db
    .select({
      emailNotificationsDisabled: user.emailNotificationsDisabled
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!preferences) {
    throw new Error('User not found')
  }

  return preferences
})
