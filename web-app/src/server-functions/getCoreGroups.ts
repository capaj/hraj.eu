import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '../../drizzle/db'
import { coreGroupMemberT, coreGroupT } from '../../drizzle/schema'
import { asc, eq } from 'drizzle-orm'
import { auth } from '~/lib/auth'

export type CoreGroupDto = {
  id: string
  name: string
  userIds: string[]
  createdAt: Date
  updatedAt: Date
}

export const getCoreGroups = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.id) {
    return [] as CoreGroupDto[]
  }

  const groups = await db
    .select({
      id: coreGroupT.id,
      name: coreGroupT.name,
      createdAt: coreGroupT.createdAt,
      updatedAt: coreGroupT.updatedAt
    })
    .from(coreGroupT)
    .where(eq(coreGroupT.createdBy, session.user.id))
    .orderBy(asc(coreGroupT.name))

  return Promise.all(
    groups.map(async (group) => {
      const members = await db
        .select({ userId: coreGroupMemberT.userId })
        .from(coreGroupMemberT)
        .where(eq(coreGroupMemberT.coreGroupId, group.id))

      return {
        id: group.id,
        name: group.name,
        userIds: members.map((member) => member.userId),
        createdAt: new Date(group.createdAt),
        updatedAt: new Date(group.updatedAt)
      } satisfies CoreGroupDto
    })
  )
})
