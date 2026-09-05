import { useEffect } from 'react'
import { useLoaderData, useRouter, useSearch } from '@tanstack/react-router'
import { msg } from '@lingui/core/macro'
import { toast } from 'sonner'
import { OnboardingPreferencesScreen } from '~/components/user/OnboardingPreferencesScreen'
import { useAuthSession } from '~/lib/auth-client'
import {
  getOnboardingSessionKey,
  getSafeOnboardingReturnPath
} from '~/lib/onboarding'
import { i18n } from '~/lib/i18n'
import { saveOnboardingPreferences } from '~/server-functions/saveOnboardingPreferences'

export function OnboardingPage() {
  const { user } = useLoaderData({ from: '/onboarding' })
  const { redirect } = useSearch({ from: '/onboarding' })
  const session = useAuthSession()
  const router = useRouter()
  const returnPath = getSafeOnboardingReturnPath(redirect)

  useEffect(() => {
    const userId = session.data?.user?.id
    const sessionId = session.data?.session?.id

    if (!userId || !sessionId || typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(
      getOnboardingSessionKey(userId, sessionId),
      'true'
    )
  }, [session.data?.session?.id, session.data?.user?.id])

  const finish = async () => {
    await router.invalidate()
    await router.navigate({ href: returnPath, replace: true })
  }

  return (
    <OnboardingPreferencesScreen
      userName={user.name}
      initialSkillLevels={user.skillLevels}
      initialNotificationPreferences={user.notificationPreferences}
      initialEmailNotificationsEnabled={!user.emailNotificationsDisabled}
      onSave={async (preferences) => {
        await saveOnboardingPreferences({ data: preferences })
        toast.success(i18n._(msg`Your preferences are ready!`))
        await finish()
      }}
      onSkip={() => void finish()}
    />
  )
}
