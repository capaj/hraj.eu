import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventCommentT, user as userTable } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'
import { EventComment } from '../types'

const EditEventCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment is too long')
})

export const editEventComment = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = EditEventCommentSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ')
      throw new Error(`Invalid payload: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be signed in to edit a comment')
    }

    const [comment] = await db
      .select({
        id: eventCommentT.id,
        userId: eventCommentT.userId,
        eventId: eventCommentT.eventId
      })
      .from(eventCommentT)
      .where(eq(eventCommentT.id, data.commentId))
      .limit(1)

    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.userId !== session.user.id) {
      throw new Error('You can only edit your own comments')
    }

    const [updated] = await db
      .update(eventCommentT)
      .set({ content: data.content.trim() })
      .where(
        and(
          eq(eventCommentT.id, data.commentId),
          eq(eventCommentT.userId, session.user.id)
        )
      )
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
      id: updated.id,
      eventId: updated.eventId,
      userId: updated.userId,
      content: updated.content,
      createdAt: new Date(updated.createdAt),
      user: {
        id: user?.id ?? session.user.id,
        name: user?.name ?? session.user.name ?? 'User',
        image: user?.image || undefined
      }
    } satisfies EventComment
  })
