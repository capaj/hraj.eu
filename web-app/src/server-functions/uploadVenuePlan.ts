import { createServerFn } from '@tanstack/react-start'
import { uploadFileToR2 } from './utils'

export const uploadVenuePlan = createServerFn({ method: 'POST' })
  .validator((formData: FormData) => formData)
  .handler(async ({ data: formData, context }) => {
    const file = formData.get('plan') as File

    const url = await uploadFileToR2(file, 'venue-plans')
    return { url }
  })

