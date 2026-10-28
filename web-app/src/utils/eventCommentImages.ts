export const MAX_COMMENT_IMAGES = 4
export const MAX_COMMENT_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_COMMENT_TEXT_LENGTH = 1000
export const COMMENT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]

// Only our raster uploads become photo attachments. Other links remain text.
export function isCommentImageUrl(value: string) {
  return /^https:\/\/uploads\.hraj\.eu\/event-comments\/[a-zA-Z0-9-]+\.(?:png|jpe?g|webp|gif)$/.test(
    value.trim()
  )
}

export function splitCommentImages(content: string) {
  const lines = content.split(/\r?\n/)
  return {
    text: lines
      .filter((line) => !isCommentImageUrl(line))
      .join('\n')
      .trim(),
    images: lines.filter(isCommentImageUrl).map((line) => line.trim())
  }
}

export function joinCommentImages(text: string, images: string[]) {
  return [text.trim(), ...images].filter(Boolean).join('\n')
}
