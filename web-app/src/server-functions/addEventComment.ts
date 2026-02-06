import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventCommentT, eventT, user as userTable } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { eq } from 'drizzle-orm'
import { EventComment } from '../types'

const AddEventCommentSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment is too long')
})

export const addEventComment = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = AddEventCommentSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid comment payload: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to comment on an event')
    }

    const [event] = await db
      .select({ id: eventT.id })
      .from(eventT)
      .where(eq(eventT.id, data.eventId))
      .limit(1)

    if (!event) {
      throw new Error('Event not found')
    }

    const [inserted] = await db
      .insert(eventCommentT)
      .values({
        eventId: data.eventId,
        userId: session.user.id,
        content: data.content.trim()
      })
      .returning()

    const [user] = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        image: userTable.image
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1)

    return {
      id: inserted.id,
      eventId: inserted.eventId,
      userId: inserted.userId,
      content: inserted.content,
      createdAt: new Date(inserted.createdAt),
      user: {
        id: user?.id ?? session.user.id,
        name: user?.name ?? session.user.name ?? 'User',
        image: user?.image || undefined
      }
    } satisfies EventComment
  })
