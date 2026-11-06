import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '../../drizzle/db'
import { auth } from '~/lib/auth'
import { uploadFileToR2 } from './utils'
import { uploadEventCommentImagesHandler } from './uploadEventCommentImagesHandler'
import { assertEventAccess } from './organizerBlockPolicy'

export const uploadEventCommentImages = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequest().headers })
    return uploadEventCommentImagesHandler({
      formData: data,
      userId: session?.user?.id,
      eventExists: async (eventId) => {
        await assertEventAccess(db, eventId, session?.user?.id)
        return true
      },
      upload: uploadFileToR2
    })
  })
