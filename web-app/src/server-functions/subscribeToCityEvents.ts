import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { auth } from '~/lib/auth'
import { cityEventSubscriptionT } from '../../drizzle/schema'
import { z } from 'zod'

const SubscribeSchema = z.object({
  citySlug: z.string().min(1),
  cityName: z.string().min(1)
})

export const subscribeToCityEvents = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => SubscribeSchema.parse(payload))
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to subscribe')
    }

    const existing = await db
      .select({ id: cityEventSubscriptionT.id })
      .from(cityEventSubscriptionT)
      .where(
        and(
          eq(cityEventSubscriptionT.userId, session.user.id),
          eq(cityEventSubscriptionT.citySlug, data.citySlug)
        )
      )
      .limit(1)

    if (!existing.length) {
      await db.insert(cityEventSubscriptionT).values({
        userId: session.user.id,
        citySlug: data.citySlug,
        cityName: data.cityName
      })
    }

    return { success: true }
  })
