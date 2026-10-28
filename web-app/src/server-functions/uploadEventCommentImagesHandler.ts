import {
  COMMENT_IMAGE_TYPES,
  MAX_COMMENT_IMAGES,
  MAX_COMMENT_IMAGE_BYTES
} from '../utils/eventCommentImages'

export async function validateCommentImage(file: File): Promise<File> {
  if (!COMMENT_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, WebP, or GIF image.')
  }
  if (file.size === 0 || file.size > MAX_COMMENT_IMAGE_BYTES) {
    throw new Error('Each picture must be between 1 byte and 10 MB.')
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const text = new TextDecoder().decode(bytes)
  let type: string | undefined
  let extension: string | undefined
  if (
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte
    )
  ) {
    type = 'image/png'
    extension = 'png'
  } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    type = 'image/jpeg'
    extension = 'jpg'
  } else if (text.startsWith('GIF87a') || text.startsWith('GIF89a')) {
    type = 'image/gif'
    extension = 'gif'
  } else if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') {
    type = 'image/webp'
    extension = 'webp'
  }
  if (type !== file.type || !extension) {
    throw new Error('The file is not a supported picture.')
  }
  // Clipboard files may have no extension. Never trust the supplied filename.
  return new File([file], `image.${extension}`, { type })
}

export async function uploadEventCommentImagesHandler({
  formData,
  userId,
  eventExists,
  upload
}: {
  formData: FormData
  userId?: string
  eventExists: (eventId: string) => Promise<boolean>
  upload: (file: File, folder: string) => Promise<string>
}) {
  if (!userId) throw new Error('You must be signed in to comment on an event')
  const eventId = formData.get('eventId')
  if (typeof eventId !== 'string' || !eventId)
    throw new Error('Event not found')
  const entries = formData.getAll('images')
  if (entries.length === 0 || entries.length > MAX_COMMENT_IMAGES) {
    throw new Error('Choose between 1 and 4 pictures.')
  }
  const files: File[] = []
  for (const entry of entries) {
    if (!(entry instanceof File)) throw new Error('Invalid images payload')
    files.push(await validateCommentImage(entry))
  }
  if (!(await eventExists(eventId))) throw new Error('Event not found')
  const urls: string[] = []
  for (const file of files) {
    urls.push(await upload(file, 'event-comments'))
  }
  return { urls }
}
