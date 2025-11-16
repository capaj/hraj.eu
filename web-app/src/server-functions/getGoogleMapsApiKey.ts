import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

export const getGoogleMapsApiKey = createServerFn({ method: 'GET' }).handler(
  async () => {
    return env.GOOGLE_MAPS_API_KEY || ''
  }
)
