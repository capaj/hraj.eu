import { createServerFn } from '@tanstack/react-start'
import { uploadFileToR2 } from './utils'

export const uploadVenueImages = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData, context }) => {
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!file || file.size === 0) continue

      const url = await uploadFileToR2(file, 'venues')
      uploadedUrls.push(url)
    }

    return { urls: uploadedUrls }
  })

