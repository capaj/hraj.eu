import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserProfile } from '../pages/UserProfilePage'
import { getCurrentUserEmailPreferences } from '~/server-functions/getCurrentUserEmailPreferences'
import { getUserById } from '~/server-functions/getUserById'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/user-profile')({
  loader: async () => {
    const session = await authClient.getSession()
    if (!session.data?.user) {
      throw redirect({
        to: '/auth/$pathname',
        params: { pathname: 'sign-in' },
      })
    }
    const [user, emailPreferences] = await Promise.all([
      getUserById({ data: session.data.user.id }),
      getCurrentUserEmailPreferences()
    ])
    return { user: { ...user, ...emailPreferences } }
  },
  component: UserProfile
})
