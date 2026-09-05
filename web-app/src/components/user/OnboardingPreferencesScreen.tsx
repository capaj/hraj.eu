import { useMemo, useState } from 'react'
import { Trans } from '@lingui/react/macro'
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import {
  NotificationSettingsCard,
  SkillLevelSettingsCard
} from '~/components/user/SportsPreferencesCards'
import { SPORTS } from '~/lib/constants'
import type { SkillLevel } from '~/types'

export interface OnboardingPreferenceValues {
  skillLevels: Record<string, SkillLevel>
  notificationPreferences: Record<string, boolean>
  emailNotificationsEnabled: boolean
}

interface OnboardingPreferencesScreenProps {
  userName?: string
  initialSkillLevels?: Record<string, SkillLevel>
  initialNotificationPreferences?: Record<string, boolean>
  initialEmailNotificationsEnabled?: boolean
  onSave: (preferences: OnboardingPreferenceValues) => Promise<void>
  onSkip: () => void
}

export function OnboardingPreferencesScreen({
  userName,
  initialSkillLevels = {},
  initialNotificationPreferences = {},
  initialEmailNotificationsEnabled = true,
  onSave,
  onSkip
}: OnboardingPreferencesScreenProps) {
  const [skillLevels, setSkillLevels] = useState(initialSkillLevels)
  const [notificationPreferences, setNotificationPreferences] = useState(
    initialNotificationPreferences
  )
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    initialEmailNotificationsEnabled
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const selectedSports = useMemo(
    () => SPORTS.filter((sport) => Boolean(skillLevels[sport.id])),
    [skillLevels]
  )

  const handleSkillLevelChange = (
    sportId: string,
    skillLevel: SkillLevel | null
  ) => {
    setSaveError(false)
    setSkillLevels((current) => {
      const next = { ...current }

      if (skillLevel) {
        next[sportId] = skillLevel
      } else {
        delete next[sportId]
      }

      return next
    })
  }

  const handleSave = async () => {
    if (selectedSports.length === 0 || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveError(false)

    const selectedSportIds = new Set<string>(
      selectedSports.map((sport) => sport.id)
    )
    const selectedNotifications = Object.fromEntries(
      Object.entries(notificationPreferences).filter(([sportId]) =>
        selectedSportIds.has(sportId)
      )
    )

    try {
      await onSave({
        skillLevels,
        notificationPreferences: selectedNotifications,
        emailNotificationsEnabled
      })
    } catch (error) {
      console.error('Failed to save onboarding preferences', error)
      setSaveError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const firstName = userName?.trim().split(/\s+/)[0]

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm">
            <Sparkles size={16} className="mr-2" />
            <Trans>Make every game a better match</Trans>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {firstName ? (
              <Trans>Welcome, {firstName}! Let&apos;s get you game-ready.</Trans>
            ) : (
              <Trans>Let&apos;s get you game-ready.</Trans>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600 sm:text-lg">
            <Trans>
              Tell us what you play and what you want to hear about. This takes
              less than a minute.
            </Trans>
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-600">
            <span className="flex items-center rounded-full bg-primary-100 px-3 py-1.5 text-primary-800">
              <CheckCircle2 size={15} className="mr-1.5" />
              <Trans>Skill levels</Trans>
            </span>
            <ArrowRight size={16} className="text-gray-400" />
            <span className="flex items-center rounded-full bg-secondary-100 px-3 py-1.5 text-secondary-800">
              <Trans>Notifications</Trans>
            </span>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
          <SkillLevelSettingsCard
            skillLevels={skillLevels}
            onChange={handleSkillLevelChange}
            stepNumber={1}
          />
          <NotificationSettingsCard
            className="xl:sticky xl:top-24"
            notificationPreferences={notificationPreferences}
            emailNotificationsEnabled={emailNotificationsEnabled}
            onSportChange={(sportId, enabled) => {
              setSaveError(false)
              setNotificationPreferences((current) => ({
                ...current,
                [sportId]: enabled
              }))
            }}
            onEmailChange={(enabled) => {
              setSaveError(false)
              setEmailNotificationsEnabled(enabled)
            }}
            sports={selectedSports}
            stepNumber={2}
          />
        </div>

        <footer className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedSports.length === 0 ? (
                <Trans>Choose at least one skill level to continue.</Trans>
              ) : (
                <Trans>
                  {selectedSports.length} sports selected — you&apos;re ready to
                  go.
                </Trans>
              )}
            </p>
            {saveError ? (
              <p className="mt-1 text-sm text-red-600">
                <Trans>We could not save your preferences. Please try again.</Trans>
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                <Trans>You can change all of these later in your profile.</Trans>
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:mt-0 sm:flex-row sm:items-center">
            <Button variant="ghost" onClick={onSkip} disabled={isSaving}>
              <Trans>Skip for now</Trans>
            </Button>
            <Button
              size="lg"
              onClick={() => void handleSave()}
              disabled={selectedSports.length === 0 || isSaving}
              className="min-w-44 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  <Trans>Saving preferences...</Trans>
                </>
              ) : (
                <>
                  <Trans>Save and start playing</Trans>
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>
    </main>
  )
}
