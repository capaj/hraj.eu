import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { getEventViewerId } from './eventViewer'
import { searchEventGuestUsersHandler } from './searchEventGuestUsersHandler'
import { assertEventAccess } from './organizerBlockPolicy'

const SearchEventGuestUsersSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  query: z.string().trim().min(1, 'Search query is required').max(100)
})

export const searchEventGuestUsers = createServerFn({ method: 'GET' })
  .inputValidator((payload: unknown) => SearchEventGuestUsersSchema.parse(payload))
  .handler(async ({ data }) => {
    const viewerId = await getEventViewerId()

    await assertEventAccess(db, data.eventId, viewerId)
    return searchEventGuestUsersHandler(db, data, viewerId)
  })
