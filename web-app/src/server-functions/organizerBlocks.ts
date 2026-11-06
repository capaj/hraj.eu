import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { organizerBlockT, user } from '../../drizzle/schema'
import { getEventViewerId } from './eventViewer'
import { setOrganizerBlockHandler } from './organizerBlocksHandler'
import { deleteOgImageFromR2 } from './utils'

async function requireOrganizerId() {
  const id = await getEventViewerId()
  if (!id) throw new Error('You must be signed in to manage blocked players')
  return id
}

export const getOrganizerBlocks = createServerFn({ method: 'GET' })
  .handler(async () => {
    const organizerId = await requireOrganizerId()
    return db.select({ id: user.id, name: user.name, image: user.image })
      .from(organizerBlockT)
      .innerJoin(user, eq(user.id, organizerBlockT.userId))
      .where(eq(organizerBlockT.organizerId, organizerId))
      .orderBy(asc(user.name), asc(user.id))
  })

export const searchBlockableUsers = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ query: z.string().trim().min(2).max(100) }))
  .handler(async ({ data }) => {
    const organizerId = await requireOrganizerId()
    return db.select({ id: user.id, name: user.name, image: user.image })
      .from(user).where(and(
        ne(user.id, organizerId),
        sql`instr(lower(${user.name}), lower(${data.query})) > 0`,
        sql`not exists (select 1 from ${organizerBlockT}
          where ${organizerBlockT.organizerId} = ${organizerId}
          and ${organizerBlockT.userId} = ${user.id})`
      )).orderBy(asc(user.name), asc(user.id)).limit(20)
  })

export const setOrganizerBlock = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ userId: z.string().min(1), blocked: z.boolean() }))
  .handler(async ({ data }) => {
    // The organizer always comes from the session, never from the payload.
    const organizerId = await requireOrganizerId()
    const result = await setOrganizerBlockHandler(db, organizerId, data)
    await Promise.all(result.affectedEventIds.map((id) =>
      deleteOgImageFromR2(id).catch((error) => console.error('Failed to clear event image', error))
    ))
    return { success: true }
  })
