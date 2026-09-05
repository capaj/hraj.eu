import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  NotificationSettingsCard,
  SkillLevelSettingsCard
} from '~/components/user/SportsPreferencesCards'
import { SPORTS } from '~/lib/constants'
import type { SkillLevel } from '~/types'

export const Route = createFileRoute('/scenarios/profile-sports-preferences')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound()
    }
  },
  component: ProfileSportsPreferencesScenario
})

function ProfileSportsPreferencesScenario() {
  const scenarioSports = SPORTS.slice(0, 2)
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>({
    soccer: 'intermediate',
    basketball: 'beginner',
    volleyball: 'advanced'
  })
  const [notificationPreferences, setNotificationPreferences] = useState({
    soccer: true,
    basketball: false,
    volleyball: true,
    futsal: true
  })
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true)

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary-700">UI scenario</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Profile sports preferences
          </h1>
          <p className="mt-2 text-gray-600">
            Skill levels and notifications now live in separate cards.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SkillLevelSettingsCard
            skillLevels={skillLevels}
            sports={scenarioSports}
            columns={1}
            onChange={(sportId, level) => {
              setSkillLevels((current) => {
                const next = { ...current }
                if (level) next[sportId] = level
                else delete next[sportId]
                return next
              })
            }}
          />

          <NotificationSettingsCard
            notificationPreferences={notificationPreferences}
            emailNotificationsEnabled={emailNotificationsEnabled}
            sports={scenarioSports}
            columns={1}
            onSportChange={(sportId, enabled) =>
              setNotificationPreferences((current) => ({
                ...current,
                [sportId]: enabled
              }))
            }
            onEmailChange={setEmailNotificationsEnabled}
          />
        </div>
      </div>
    </main>
  )
}
