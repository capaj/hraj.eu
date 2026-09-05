import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { venueEventSubscriptionT, venueT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'

const UpdateVenueEventSubscriptionSchema = z.object({
  venueId: z.string().min(1),
  subscribed: z.boolean()
})

async function getSessionUserId() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user?.id
}

export const getVenueEventSubscriptions = createServerFn({
  method: 'GET'
}).handler(async () => {
  const userId = await getSessionUserId()

  if (!userId) {
    return { isAuthenticated: false, venueIds: [] as string[] }
  }

  const subscriptions = await db
    .select({ venueId: venueEventSubscriptionT.venueId })
    .from(venueEventSubscriptionT)
    .where(eq(venueEventSubscriptionT.userId, userId))

  return {
    isAuthenticated: true,
    venueIds: subscriptions.map((subscription) => subscription.venueId)
  }
})

export const updateVenueEventSubscription = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) =>
    UpdateVenueEventSubscriptionSchema.parse(payload)
  )
  .handler(async ({ data }) => {
    const userId = await getSessionUserId()

    if (!userId) {
      throw new Error('You must be signed in to manage venue subscriptions')
    }

    if (!data.subscribed) {
      await db
        .delete(venueEventSubscriptionT)
        .where(
          and(
            eq(venueEventSubscriptionT.userId, userId),
            eq(venueEventSubscriptionT.venueId, data.venueId)
          )
        )

      return { subscribed: false }
    }

    const venue = await db
      .select({ id: venueT.id })
      .from(venueT)
      .where(eq(venueT.id, data.venueId))
      .limit(1)

    if (!venue.length) {
      throw new Error('Venue not found')
    }

    await db
      .insert(venueEventSubscriptionT)
      .values({
        userId,
        venueId: data.venueId,
        lastNotifiedEventCreatedAt: new Date()
      })
      .onConflictDoNothing()

    return { subscribed: true }
  })
