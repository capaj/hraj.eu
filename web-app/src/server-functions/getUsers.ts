import { createServerFn } from '@tanstack/react-start'
import { db } from '../../drizzle/db'
import { z } from 'zod'
import { getUsersHandler } from './getUsersHandler'

export const getUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z
      .object({
        limit: z.number().int().positive().max(100).optional(),
        sport: z.string().optional()
      })
      .optional()
      .parse(data)
  )
  .handler(async ({ data }) => {
    return getUsersHandler(db, data)
  })
