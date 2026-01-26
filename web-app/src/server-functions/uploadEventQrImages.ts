import { createServerFn } from '@tanstack/react-start'
import { uploadFileToR2 } from './utils'

export const uploadEventQrImages = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const MAX_FILES_PER_REQUEST = 10
    const MAX_BYTES_PER_FILE = 10 * 1024 * 1024
    const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

    const entries = formData.getAll('images')
    const nonEmptyFiles = entries.filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (nonEmptyFiles.length === 0) {
      throw new Error('No files provided')
    }

    if (nonEmptyFiles.length > MAX_FILES_PER_REQUEST) {
      throw new Error(`Too many files (max ${MAX_FILES_PER_REQUEST})`)
    }

    const uploadedUrls: string[] = []

    for (const file of nonEmptyFiles) {
      if (file.size > MAX_BYTES_PER_FILE) {
        throw new Error(`File too large (max 10MB): ${file.name}`)
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(`Unsupported image type: ${file.type}`)
      }

      const url = await uploadFileToR2(file, 'event-qr-codes')
      uploadedUrls.push(url)
    }

    return { urls: uploadedUrls }
  })
