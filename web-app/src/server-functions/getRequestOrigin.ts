import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const getRequestOrigin = createServerFn({ method: 'GET' }).handler(() => {
  const request = getRequest()
  return new URL(request.url).origin
})

