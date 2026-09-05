import { useEffect, useRef } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { useAuthSession } from '~/lib/auth-client'
import {
  getOnboardingSessionKey,
  isOnboardingRedirectExcluded
} from '~/lib/onboarding'
import { getCurrentUserOnboardingStatus } from '~/server-functions/getCurrentUserOnboardingStatus'

export function OnboardingRedirect() {
  const session = useAuthSession()
  const router = useRouter()
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  })
  const checkingSessionId = useRef<string | null>(null)

  useEffect(() => {
    const userId = session.data?.user?.id
    const sessionId = session.data?.session?.id

    if (
      !userId ||
      !sessionId ||
      isOnboardingRedirectExcluded(pathname) ||
      typeof window === 'undefined'
    ) {
      return
    }

    const storageKey = getOnboardingSessionKey(userId, sessionId)
    if (
      window.sessionStorage.getItem(storageKey) === 'true' ||
      checkingSessionId.current === sessionId
    ) {
      return
    }

    checkingSessionId.current = sessionId

    getCurrentUserOnboardingStatus()
      .then(({ hasSkillLevel }) => {
        window.sessionStorage.setItem(storageKey, 'true')

        if (!hasSkillLevel) {
          const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
          void router.navigate({
            to: '/onboarding',
            search: { redirect },
            replace: true
          })
        }
      })
      .catch((error) => {
        checkingSessionId.current = null
        console.error('Failed to check onboarding status', error)
      })
  }, [pathname, router, session.data?.session?.id, session.data?.user?.id])

  return null
}
