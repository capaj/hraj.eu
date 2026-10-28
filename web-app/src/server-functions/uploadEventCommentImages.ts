import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { eventT } from '../../drizzle/schema'
import { auth } from '~/lib/auth'
import { uploadFileToR2 } from './utils'
import { uploadEventCommentImagesHandler } from './uploadEventCommentImagesHandler'

export const uploadEventCommentImages = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequest().headers })
    return uploadEventCommentImagesHandler({
      formData: data,
      userId: session?.user?.id,
      eventExists: async (eventId) => {
        const [event] = await db
          .select({ id: eventT.id })
          .from(eventT)
          .where(eq(eventT.id, eventId))
          .limit(1)
        return !!event
      },
      upload: uploadFileToR2
    })
  })
