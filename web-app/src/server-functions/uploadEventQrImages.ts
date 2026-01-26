import { createServerFn } from '@tanstack/react-start'
import { uploadFileToR2 } from './utils'

const MAX_FILES_PER_REQUEST = 10
const MAX_MB_PER_FILE = 10
const MAX_BYTES_PER_FILE = MAX_MB_PER_FILE * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

export const uploadEventQrImages = createServerFn({ method: 'POST' })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const entries = formData.getAll('images')
    const nonEmptyFiles: File[] = []

    for (const entry of entries) {
      if (!(entry instanceof File)) {
        throw new Error('Invalid images payload')
      }
      if (entry.size > 0) nonEmptyFiles.push(entry)
    }

    if (nonEmptyFiles.length === 0) {
      throw new Error('No files provided')
    }

    if (nonEmptyFiles.length > MAX_FILES_PER_REQUEST) {
      throw new Error(`Too many files (max ${MAX_FILES_PER_REQUEST})`)
    }

    const validationErrors: string[] = []

    for (const file of nonEmptyFiles) {
      if (file.size > MAX_BYTES_PER_FILE) {
        validationErrors.push(`File too large (max ${MAX_MB_PER_FILE}MB): ${file.name}`)
      }

      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
        validationErrors.push(`Unsupported image file extension: ${file.name}`)
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        validationErrors.push(`Unsupported image type: ${file.type}`)
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '))
    }

    const uploadedUrls: string[] = []

    for (const file of nonEmptyFiles) {
      const url = await uploadFileToR2(file, 'event-qr-codes')
      uploadedUrls.push(url)
    }

    return { urls: uploadedUrls }
  })
