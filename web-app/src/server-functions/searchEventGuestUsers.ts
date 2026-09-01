import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { auth } from '~/lib/auth'
import { searchEventGuestUsersHandler } from './searchEventGuestUsersHandler'

const SearchEventGuestUsersSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  query: z.string().trim().min(1, 'Search query is required').max(100)
})

export const searchEventGuestUsers = createServerFn({ method: 'GET' })
  .inputValidator((payload: unknown) => SearchEventGuestUsersSchema.parse(payload))
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    return searchEventGuestUsersHandler(db, data, session?.user?.id)
  })
