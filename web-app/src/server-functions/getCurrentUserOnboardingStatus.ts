import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { userSkillT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'

export const getCurrentUserOnboardingStatus = createServerFn({
  method: 'GET'
}).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.id) {
    throw new Error('You must be signed in to view your onboarding status')
  }

  const [skill] = await db
    .select({ id: userSkillT.id })
    .from(userSkillT)
    .where(eq(userSkillT.userId, session.user.id))
    .limit(1)

  return { hasSkillLevel: Boolean(skill) }
})
