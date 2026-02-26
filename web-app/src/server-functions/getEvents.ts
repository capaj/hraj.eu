import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '../../drizzle/db'
import { eventStatuses } from '../../drizzle/schema'
import { z } from 'zod'
import { getEventsHandler } from './getEventsHandler'
import { auth } from '~/lib/auth'

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
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    return getEventsHandler(db, data, session?.user?.id)
  })
