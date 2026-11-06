import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { auth } from '../lib/auth'

export async function getEventViewerId() {
  // Event responses now depend on the session, including during SSR.
  setResponseHeader('Cache-Control', 'private, no-store')
  const session = await auth.api.getSession({ headers: getRequest().headers })
  return session?.user?.id
}
