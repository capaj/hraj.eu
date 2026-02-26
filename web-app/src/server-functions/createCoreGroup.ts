import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { coreGroupMemberT, coreGroupT } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { auth } from '~/lib/auth'

const CreateCoreGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  userIds: z.array(z.string().min(1)).min(1)
})

export const createCoreGroup = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => CreateCoreGroupSchema.parse(payload))
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to create a core group')
    }

    const [group] = await db
      .insert(coreGroupT)
      .values({
        name: data.name,
        createdBy: session.user.id
      })
      .returning({ id: coreGroupT.id })

    if (!group?.id) {
      throw new Error('Failed to create core group')
    }

    const members = Array.from(new Set([...data.userIds, session.user.id]))
    await db.insert(coreGroupMemberT).values(
      members.map((userId) => ({
        coreGroupId: group.id,
        userId
      }))
    )

    return { id: group.id }
  })
