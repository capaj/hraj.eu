import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  uploadEventCommentImagesHandler,
  validateCommentImage
} from '../src/server-functions/uploadEventCommentImagesHandler.ts'
import { eventCommentContentSchema } from '../src/server-functions/eventCommentValidation.ts'
import {
  splitCommentImages,
  isCommentImageUrl
} from '../src/utils/eventCommentImages.ts'

const png = await readFile(
  new URL('../public/brand/hraj-social.png', import.meta.url)
)
const imageUrl = 'https://uploads.hraj.eu/event-comments/123-abc.png'
const makeData = (...files) => {
  const data = new FormData()
  data.set('eventId', 'event')
  files.forEach((file) => data.append('images', file))
  return data
}
const picture = () =>
  new File([png], 'pasted-without-extension', { type: 'image/png' })

test('comment upload uses R2 folder and normalizes clipboard filenames', async () => {
  const calls = []
  const result = await uploadEventCommentImagesHandler({
    formData: makeData(picture()),
    userId: 'player',
    eventExists: async (id) => id === 'event',
    upload: async (file, folder) => {
      calls.push({ name: file.name, type: file.type, folder })
      return imageUrl
    }
  })
  assert.deepEqual(result, { urls: [imageUrl] })
  assert.deepEqual(calls, [
    { name: 'image.png', type: 'image/png', folder: 'event-comments' }
  ])
})

test('unauthenticated users, missing events and invalid batches never upload', async () => {
  let uploads = 0
  const defaults = {
    formData: makeData(picture()),
    userId: 'player',
    eventExists: async () => true,
    upload: async () => {
      uploads++
      return imageUrl
    }
  }
  await assert.rejects(
    uploadEventCommentImagesHandler({ ...defaults, userId: undefined }),
    /signed in/
  )
  await assert.rejects(
    uploadEventCommentImagesHandler({
      ...defaults,
      eventExists: async () => false
    }),
    /Event not found/
  )
  for (const files of [
    [],
    Array.from({ length: 5 }, picture),
    [picture(), new File(['not a png'], 'bad.png', { type: 'image/png' })]
  ]) {
    await assert.rejects(
      uploadEventCommentImagesHandler({
        ...defaults,
        formData: makeData(...files)
      })
    )
  }
  assert.equal(uploads, 0)
})

test('rejects SVG, disguised files, empty images and oversized images', async () => {
  for (const file of [
    new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' }),
    new File([png], 'image.jpg', { type: 'image/jpeg' }),
    new File([], 'empty.png', { type: 'image/png' }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png'
    })
  ])
    await assert.rejects(validateCommentImage(file))
})

test('supports JPEG, GIF and WebP headers and normalizes their extensions', async () => {
  for (const [bytes, type, extension] of [
    [new Uint8Array([255, 216, 255, 224]), 'image/jpeg', 'jpg'],
    ['GIF89a123456', 'image/gif', 'gif'],
    ['RIFF1234WEBP', 'image/webp', 'webp']
  ]) {
    assert.equal(
      (await validateCommentImage(new File([bytes], 'clipboard', { type })))
        .name,
      `image.${extension}`
    )
  }
})

test('keeps 1000 characters of text alongside up to four pictures, including picture-only comments', () => {
  assert.equal(eventCommentContentSchema.safeParse(imageUrl).success, true)
  const content = ['x'.repeat(1000), ...Array(4).fill(imageUrl)].join('\n')
  assert.equal(eventCommentContentSchema.safeParse(content).success, true)
  assert.equal(
    eventCommentContentSchema.safeParse(['x'.repeat(1001), imageUrl].join('\n'))
      .success,
    false
  )
  assert.equal(
    eventCommentContentSchema.safeParse(Array(5).fill(imageUrl).join('\n'))
      .success,
    false
  )
  assert.equal(eventCommentContentSchema.safeParse('   ').success, false)
  assert.deepEqual(splitCommentImages(`Hello\n${imageUrl}`), {
    text: 'Hello',
    images: [imageUrl]
  })
})

test('only embeds raster pictures from the comment folder on our R2 domain', () => {
  for (const url of [
    'https://evil.example/image.png',
    'https://uploads.hraj.eu.evil.example/event-comments/image.png',
    'https://uploads.hraj.eu/event-comments/image.svg',
    'https://uploads.hraj.eu/venues/image.png',
    `some text ${imageUrl}`
  ])
    assert.equal(isCommentImageUrl(url), false)
  assert.equal(isCommentImageUrl(imageUrl), true)
})
