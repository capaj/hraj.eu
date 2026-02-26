import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { coreGroupT } from '../../drizzle/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '~/lib/auth'

const DeleteCoreGroupSchema = z.object({ id: z.string().min(1) })

export const deleteCoreGroup = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => DeleteCoreGroupSchema.parse(payload))
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to delete a core group')
    }

    await db
      .delete(coreGroupT)
      .where(
        and(
          eq(coreGroupT.id, data.id),
          eq(coreGroupT.createdBy, session.user.id)
        )
      )

    return { success: true }
  })
