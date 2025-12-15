import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { eq } from 'drizzle-orm'

export const deleteUserAccount = createServerFn({ method: 'POST' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to delete your account')
    }

    // Cascade delete should handle related records (user_skill, event, participant, etc.) if configured in schema.
    // If not, we might need manual cleanup. 
    // Schema definitions show:
    // userSkillT: .references(() => user.id, { onDelete: 'cascade' })
    // eventT: .references(() => user.id, { onDelete: 'cascade' })
    // participantT: .references(() => user.id, { onDelete: 'cascade' })
    // notificationT: .references(() => user.id, { onDelete: 'cascade' })
    // account/session: onDelete: 'cascade'
    
    // So simple delete on user table should be enough.

    await db.delete(user).where(eq(user.id, session.user.id))

    return { success: true }
  })
