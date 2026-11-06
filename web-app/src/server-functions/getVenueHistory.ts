import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { queryVenueHistory } from './venueHistory'
import { getEventViewerId } from './eventViewer'

export const getVenueHistory = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      venueId: z.string().min(1),
      page: z.number().int().min(1).max(100000).default(1)
    })
  )
  .handler(async ({ data }) => queryVenueHistory(db, data.venueId, data.page, new Date(), await getEventViewerId()))
