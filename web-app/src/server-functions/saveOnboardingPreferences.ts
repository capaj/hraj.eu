import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { user, userSkillT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { SPORTS } from '~/lib/constants'

const skillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])
const supportedSportIds = new Set<string>(SPORTS.map((sport) => sport.id))

const onboardingPreferencesSchema = z
  .object({
    skillLevels: z.record(z.string(), skillLevelSchema),
    notificationPreferences: z.record(z.string(), z.boolean()),
    emailNotificationsEnabled: z.boolean()
  })
  .superRefine((preferences, context) => {
    const skillSports = Object.keys(preferences.skillLevels)
    if (skillSports.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['skillLevels'],
        message: 'Choose at least one sport and skill level'
      })
    }

    for (const sportId of [
      ...skillSports,
      ...Object.keys(preferences.notificationPreferences)
    ]) {
      if (!supportedSportIds.has(sportId)) {
        context.addIssue({
          code: 'custom',
          message: `Unsupported sport: ${sportId}`
        })
      }
    }
  })

export type OnboardingPreferences = z.infer<
  typeof onboardingPreferencesSchema
>

export const saveOnboardingPreferences = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => onboardingPreferencesSchema.parse(payload))
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to finish onboarding')
    }

    const skillRows = Object.entries(data.skillLevels).map(
      ([sport, skillLevel]) => ({
        userId: session.user.id,
        sport,
        skillLevel
      })
    )

    await db.transaction(async (transaction) => {
      await transaction
        .delete(userSkillT)
        .where(eq(userSkillT.userId, session.user.id))

      await transaction.insert(userSkillT).values(skillRows)

      await transaction
        .update(user)
        .set({
          notificationPreferences: data.notificationPreferences,
          emailNotificationsDisabled: !data.emailNotificationsEnabled,
          updatedAt: new Date()
        })
        .where(eq(user.id, session.user.id))
    })

    return { success: true }
  })
