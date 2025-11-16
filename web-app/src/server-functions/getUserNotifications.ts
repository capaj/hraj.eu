import { createServerFn } from '@tanstack/react-start'
import { Notification } from '../types'

export const getUserNotifications = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return [] as Notification[]
  })
