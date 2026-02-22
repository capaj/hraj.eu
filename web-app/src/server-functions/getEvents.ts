import { createServerFn } from '@tanstack/react-start'
import { db } from '../../drizzle/db'
import { eventStatuses } from '../../drizzle/schema'
import { z } from 'zod'
import { getEventsHandler } from './getEventsHandler'

export const getEvents = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z
      .object({
        statuses: z
          .array(z.enum(eventStatuses))
          .optional()
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => getEventsHandler(db, data))
