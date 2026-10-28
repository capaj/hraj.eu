import { z } from 'zod'
import {
  MAX_COMMENT_IMAGES,
  MAX_COMMENT_TEXT_LENGTH,
  splitCommentImages
} from '../utils/eventCommentImages'

export const eventCommentContentSchema = z
  .string()
  .trim()
  .min(1, 'Comment cannot be empty')
  .max(3000, 'Comment is too long')
  .refine(
    (content) =>
      splitCommentImages(content).text.length <= MAX_COMMENT_TEXT_LENGTH,
    'Comment is too long'
  )
  .refine(
    (content) =>
      splitCommentImages(content).images.length <= MAX_COMMENT_IMAGES,
    'Too many comment pictures'
  )
