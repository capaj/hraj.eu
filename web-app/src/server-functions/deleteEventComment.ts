import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { eventCommentT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { and, eq } from 'drizzle-orm'

const DeleteEventCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required')
})

export const deleteEventComment = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = DeleteEventCommentSchema.safeParse(payload)
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
      throw new Error('You must be signed in to delete a comment')
    }

    const [comment] = await db
      .select({ id: eventCommentT.id, userId: eventCommentT.userId })
      .from(eventCommentT)
      .where(eq(eventCommentT.id, data.commentId))
      .limit(1)

    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.userId !== session.user.id) {
      throw new Error('You can only delete your own comments')
    }

    await db
      .delete(eventCommentT)
      .where(
        and(
          eq(eventCommentT.id, data.commentId),
          eq(eventCommentT.userId, session.user.id)
        )
      )

    return { success: true, commentId: data.commentId }
  })
