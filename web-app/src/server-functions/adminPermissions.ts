import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { isAdminEmail } from '~/lib/admin'

async function getCurrentSession() {
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
}

export async function isCurrentRequestAdmin() {
  const session = await getCurrentSession()
  return !!session?.user?.id && isAdminEmail(session.user.email)
}

export async function requireAdmin() {
  const session = await getCurrentSession()

  if (!session?.user?.id) {
    throw new Error('You must be signed in to access this page')
  }

  if (!isAdminEmail(session.user.email)) {
    throw new Error('Administrator access is required')
  }

  return session.user
}
