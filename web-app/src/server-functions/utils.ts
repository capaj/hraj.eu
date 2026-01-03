import { env } from 'cloudflare:workers'

export async function uploadFileToR2(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('No file provided')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${file.type}`)
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`File too large: ${file.name}`)
  }

  const bucket = env.hraj_eu_uploads
  if (!bucket) {
    throw new Error('R2 bucket not available')
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension) {
    throw new Error(`File has no extension: ${file.name}`)
  }

  const filename = `${folder}/${timestamp}-${randomString}.${extension}`

  const arrayBuffer = await file.arrayBuffer()

  await bucket.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type
    }
  })

  return `https://uploads.hraj.eu/${filename}`
}

export async function deleteOgImageFromR2(eventId: string): Promise<void> {
  const bucket = env.hraj_eu_uploads
  if (!bucket) {
    console.warn('R2 bucket not available')
    return
  }
  const key = `og-images/${eventId}.png`
  await bucket.delete(key)
}

