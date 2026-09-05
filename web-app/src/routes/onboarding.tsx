import { createFileRoute, redirect } from '@tanstack/react-router'
import { OnboardingPage } from '~/pages/OnboardingPage'
import { authClient } from '~/lib/auth-client'
import { getUserById } from '~/server-functions/getUserById'
import { getCurrentUserPreferences } from '~/server-functions/getCurrentUserPreferences'

export const Route = createFileRoute('/onboarding')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined
  }),
  loader: async () => {
    const session = await authClient.getSession()
    if (!session.data?.user) {
      throw redirect({
        to: '/auth/$pathname',
        params: { pathname: 'sign-in' }
      })
    }

    const [user, currentUserPreferences] = await Promise.all([
      getUserById({ data: session.data.user.id }),
      getCurrentUserPreferences()
    ])

    return { user: { ...user, ...currentUserPreferences } }
  },
  component: OnboardingPage
})
