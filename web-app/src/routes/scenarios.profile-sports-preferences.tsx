import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  NotificationSettingsCard,
  SkillLevelSettingsCard
} from '~/components/user/SportsPreferencesCards'
import { OrganizerBlocksCard } from '~/components/user/OrganizerBlocksCard'
import type { BlockableUser } from '~/lib/organizerBlocks'
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
  const [blockedUsers, setBlockedUsers] = useState<BlockableUser[]>([
    { id: 'petr', name: 'Petr Novák' }
  ])

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-white">
          <h1 className="text-3xl font-bold">Můj profil</h1>
        </div>

        <div className="space-y-8">
          <SkillLevelSettingsCard
            skillLevels={skillLevels}
            sports={scenarioSports}
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
            onSportChange={(sportId, enabled) =>
              setNotificationPreferences((current) => ({
                ...current,
                [sportId]: enabled
              }))
            }
            onEmailChange={setEmailNotificationsEnabled}
          />

          <OrganizerBlocksCard
            blockedUsers={blockedUsers}
            searchUsers={async () => []}
            onChange={async (userId) => {
              setBlockedUsers((current) => current.filter((user) => user.id !== userId))
            }}
          />
        </div>
      </div>
    </main>
  )
}
