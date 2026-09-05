import { createFileRoute, redirect } from '@tanstack/react-router'
import { OnboardingPage } from '~/pages/OnboardingPage'
import { authClient } from '~/lib/auth-client'
import { getUserById } from '~/server-functions/getUserById'
import { getCurrentUserEmailPreferences } from '~/server-functions/getCurrentUserEmailPreferences'

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

    const [user, emailPreferences] = await Promise.all([
      getUserById({ data: session.data.user.id }),
      getCurrentUserEmailPreferences()
    ])

    return { user: { ...user, ...emailPreferences } }
  },
  component: OnboardingPage
})
