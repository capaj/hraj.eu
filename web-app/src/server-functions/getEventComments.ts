import { createServerFn } from '@tanstack/react-start'
import { db } from '../../drizzle/db'
import { eventCommentT, user as userTable } from '../../drizzle/schema'
import { asc, eq, inArray } from 'drizzle-orm'
import { EventComment } from '../types'

export const getEventComments = createServerFn({ method: 'GET' })
  .inputValidator((eventId: string) => eventId)
  .handler(async ({ data: eventId }) => {
    const comments = await db
      .select()
      .from(eventCommentT)
      .where(eq(eventCommentT.eventId, eventId))
      .orderBy(asc(eventCommentT.createdAt))

    if (comments.length === 0) {
      return [] as EventComment[]
    }

    const userIds = Array.from(new Set(comments.map((comment) => comment.userId)))

    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        image: userTable.image
      })
      .from(userTable)
      .where(inArray(userTable.id, userIds))

    const usersById = new Map(users.map((user) => [user.id, user]))

    return comments.map((comment) => {
      const user = usersById.get(comment.userId)
      return {
        id: comment.id,
        eventId: comment.eventId,
        userId: comment.userId,
        content: comment.content,
        createdAt: new Date(comment.createdAt),
        user: {
          id: user?.id ?? comment.userId,
          name: user?.name ?? 'User',
          image: user?.image || undefined
        }
      } satisfies EventComment
    })
  })
