import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { requireAdmin } from './adminPermissions'

const ClearEventJoinBanSchema = z.object({ userId: z.string().min(1) })

export const clearEventJoinBan = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => ClearEventJoinBanSchema.parse(payload))
  .handler(async ({ data }) => {
    await requireAdmin()

    const [unbannedUser] = await db
      .update(user)
      .set({ eventJoinBannedUntil: null })
      .where(eq(user.id, data.userId))
      .returning({ id: user.id })

    if (!unbannedUser) {
      throw new Error('User not found')
    }

    return unbannedUser
  })
