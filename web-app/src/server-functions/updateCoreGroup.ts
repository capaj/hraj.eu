import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { coreGroupMemberT, coreGroupT } from '../../drizzle/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '~/lib/auth'

const UpdateCoreGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  userIds: z.array(z.string().min(1)).min(1)
})

export const updateCoreGroup = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => UpdateCoreGroupSchema.parse(payload))
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to update a core group')
    }

    const group = await db.query.coreGroupT.findFirst({
      where: and(
        eq(coreGroupT.id, data.id),
        eq(coreGroupT.createdBy, session.user.id)
      )
    })

    if (!group) {
      throw new Error('Core group not found')
    }

    await db
      .update(coreGroupT)
      .set({ name: data.name })
      .where(eq(coreGroupT.id, data.id))

    await db
      .delete(coreGroupMemberT)
      .where(eq(coreGroupMemberT.coreGroupId, data.id))

    const members = Array.from(new Set([...data.userIds, session.user.id]))
    await db.insert(coreGroupMemberT).values(
      members.map((userId) => ({
        coreGroupId: data.id,
        userId
      }))
    )

    return { success: true }
  })
