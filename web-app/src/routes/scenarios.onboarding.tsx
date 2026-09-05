import { createFileRoute, notFound } from '@tanstack/react-router'
import { toast } from 'sonner'
import { OnboardingPreferencesScreen } from '~/components/user/OnboardingPreferencesScreen'

export const Route = createFileRoute('/scenarios/onboarding')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound()
    }
  },
  component: OnboardingScenario
})

function OnboardingScenario() {
  return (
    <OnboardingPreferencesScreen
      userName="Alex Morgan"
      initialSkillLevels={{
        soccer: 'intermediate',
        basketball: 'beginner',
        volleyball: 'advanced'
      }}
      initialNotificationPreferences={{
        soccer: true,
        basketball: false,
        volleyball: true
      }}
      initialEmailNotificationsEnabled={true}
      onSave={async () => {
        toast.success('Scenario preferences saved')
      }}
      onSkip={() => toast.message('Scenario skipped')}
    />
  )
}
