import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { eq } from 'drizzle-orm'

const UpdateUserProfileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  preferredCurrency: z.string().optional(),
  revolutTag: z.string().optional(),
  bankAccount: z.string().optional(),
  image: z.string().optional(),
  notificationPreferences: z.record(z.string(), z.boolean()).optional()
})

export const updateUserProfile = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    return UpdateUserProfileSchema.parse(payload)
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to update your profile')
    }
    
    if (Object.keys(data).length === 0) {
        return { success: true }
    }

    await db.update(user).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(user.id, session.user.id))

    return { success: true }
  })
