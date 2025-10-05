let handleAuthRequest: (request: Request) => Promise<Response>

if (import.meta.env.SSR) {
  handleAuthRequest = async (request: Request) => {
    const { auth } = await import('../../../lib/auth')
    return auth.handler(request)
  }
} else {
  handleAuthRequest = async () => {
    throw new Error('Auth API route should only run on the server')
  }
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  component: AuthApiRoute,
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleAuthRequest(request),
      POST: ({ request }: { request: Request }) => handleAuthRequest(request),
    },
  },
} as any)

function AuthApiRoute() {
  return null
}