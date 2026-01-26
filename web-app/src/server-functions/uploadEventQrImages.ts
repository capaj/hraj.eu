import { createServerFn } from '@tanstack/react-start'
import { uploadFileToR2 } from './utils'

export const uploadEventQrImages = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!file || file.size === 0) continue

      const url = await uploadFileToR2(file, 'event-qr-codes')
      uploadedUrls.push(url)
    }

    return { urls: uploadedUrls }
  })
