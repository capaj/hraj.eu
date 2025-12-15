import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { userSkillT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'

const UpdateUserSkillSchema = z.object({
  sport: z.string().min(1),
  skillLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .nullable()
    .optional()
})

export const updateUserSkill = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = UpdateUserSkillSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error('Invalid payload')
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to update skills')
    }

    const { sport, skillLevel } = data

    if (skillLevel) {
      // Upsert
      await db
        .insert(userSkillT)
        .values({
          userId: session.user.id,
          sport,
          skillLevel
        })
        .onConflictDoUpdate({
          target: [userSkillT.userId, userSkillT.sport],
          set: {
            skillLevel,
            updatedAt: new Date()
          }
        })
    } else {
      // Delete
      await db
        .delete(userSkillT)
        .where(
          and(
            eq(userSkillT.userId, session.user.id),
            eq(userSkillT.sport, sport)
          )
        )
    }

    return { success: true }
  })
