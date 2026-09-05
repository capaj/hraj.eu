import { Trans } from '@lingui/react/macro'
import { Bell, BellOff, Check, Star, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Toggle } from '~/components/ui/Toggle'
import { SportIcon } from '~/components/sports/SportIcon'
import { SKILL_LEVELS, SPORTS } from '~/lib/constants'
import type { SkillLevel } from '~/types'

type Sport = (typeof SPORTS)[number]
type SkillLevels = Record<string, SkillLevel>

interface SkillLevelSettingsCardProps {
  skillLevels: SkillLevels
  onChange: (sportId: string, level: SkillLevel | null) => void
  pendingChanges?: Record<string, SkillLevel | null>
  className?: string
  stepNumber?: number
}

interface NotificationSettingsCardProps {
  notificationPreferences: Record<string, boolean>
  emailNotificationsEnabled: boolean
  onSportChange: (sportId: string, enabled: boolean) => void
  onEmailChange: (enabled: boolean) => void
  pendingChanges?: Record<string, boolean>
  isSavingEmailPreference?: boolean
  sports?: readonly Sport[]
  className?: string
  stepNumber?: number
}

function StepNumber({ children }: { children: number }) {
  return (
    <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
      {children}
    </span>
  )
}

function UpdatedLabel() {
  return (
    <span className="mt-1 flex items-center text-xs font-medium text-green-600">
      <Check size={13} className="mr-1" />
      <Trans>Updated</Trans>
    </span>
  )
}

export function SkillLevelSettingsCard({
  skillLevels,
  onChange,
  pendingChanges = {},
  className,
  stepNumber
}: SkillLevelSettingsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start">
          {stepNumber ? <StepNumber>{stepNumber}</StepNumber> : null}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-gray-900">
              {!stepNumber ? <Star size={20} className="mr-2" /> : null}
              <Trans>Skill levels</Trans>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              <Trans>
                Choose your level for every sport you play. You can add more
                sports or change a level at any time.
              </Trans>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            <Trans>Skill level guide</Trans>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SkillLegendItem
              letter="B"
              color="bg-green-500"
              title={<Trans>Beginner</Trans>}
              description={<Trans>New or casual player</Trans>}
            />
            <SkillLegendItem
              letter="I"
              color="bg-yellow-500"
              title={<Trans>Intermediate</Trans>}
              description={<Trans>Regular, experienced player</Trans>}
            />
            <SkillLegendItem
              letter="A"
              color="bg-red-500"
              title={<Trans>Advanced</Trans>}
              description={<Trans>Competitive player</Trans>}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {SPORTS.map((sport) => {
            const currentLevel = skillLevels[sport.id]
            const isPending = pendingChanges[sport.id] !== undefined

            return (
              <div
                key={sport.id}
                className={clsx(
                  'flex min-h-16 items-center justify-between gap-3 rounded-lg border p-3 transition-colors',
                  isPending
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SportIcon
                    sport={sport.id}
                    size={24}
                    className="flex-shrink-0 text-primary-600"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900">
                      {sport.name}
                    </div>
                    {isPending ? <UpdatedLabel /> : null}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  {SKILL_LEVELS.map((level) => {
                    const isSelected = currentLevel === level.id
                    const isChanging =
                      isPending && pendingChanges[sport.id] === level.id

                    return (
                      <button
                        key={level.id}
                        type="button"
                        aria-label={`${sport.name}: ${level.name}`}
                        aria-pressed={isSelected}
                        title={level.name}
                        disabled={isPending}
                        onClick={() =>
                          onChange(sport.id, isSelected ? null : level.id)
                        }
                        className={clsx(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                          getSkillButtonClass(level.id, isSelected),
                          isPending
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer',
                          isChanging && 'ring-2 ring-green-400 ring-offset-1'
                        )}
                      >
                        {isChanging ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          level.name.charAt(0).toUpperCase()
                        )}
                      </button>
                    )
                  })}

                  {currentLevel && !isPending ? (
                    <button
                      type="button"
                      onClick={() => onChange(sport.id, null)}
                      className="ml-1 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Remove skill level"
                      aria-label={`Remove ${sport.name} skill level`}
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {Object.keys(skillLevels).length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-gray-500">
            <Star size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="font-medium text-gray-700">
              <Trans>No skill levels set yet</Trans>
            </p>
            <p className="mt-1 text-sm">
              <Trans>Choose B, I, or A beside at least one sport.</Trans>
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex items-start rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Star size={16} className="mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
          <p>
            <Trans>
              Accurate levels help you find games with players of similar
              ability.
            </Trans>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function NotificationSettingsCard({
  notificationPreferences,
  emailNotificationsEnabled,
  onSportChange,
  onEmailChange,
  pendingChanges = {},
  isSavingEmailPreference = false,
  sports = SPORTS,
  className,
  stepNumber
}: NotificationSettingsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start">
          {stepNumber ? <StepNumber>{stepNumber}</StepNumber> : null}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-gray-900">
              {!stepNumber ? (
                emailNotificationsEnabled ? (
                  <Bell size={20} className="mr-2" />
                ) : (
                  <BellOff size={20} className="mr-2" />
                )
              ) : null}
              <Trans>Notifications</Trans>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              <Trans>Choose which updates you want to receive.</Trans>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between gap-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <div className="font-medium text-gray-900">
              <Trans>Event activity emails</Trans>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              <Trans>
                Confirmations, cancellations, event changes, and hourly comment
                digests.
              </Trans>
            </p>
          </div>
          <Toggle
            checked={emailNotificationsEnabled}
            onChange={onEmailChange}
            disabled={isSavingEmailPreference}
          />
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900">
            <Trans>New game alerts by sport</Trans>
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            <Trans>Get notified when a new game is added for a sport.</Trans>
          </p>

          {sports.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sports.map((sport) => {
                const isEnabled =
                  notificationPreferences[sport.id] ?? false
                const isPending = pendingChanges[sport.id] !== undefined

                return (
                  <div
                    key={sport.id}
                    className={clsx(
                      'flex min-h-16 items-center justify-between gap-4 rounded-lg border p-3 transition-colors',
                      isPending
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <SportIcon
                        sport={sport.id}
                        size={24}
                        className="flex-shrink-0 text-primary-600"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {sport.name}
                        </div>
                        {isPending ? <UpdatedLabel /> : null}
                      </div>
                    </div>
                    <Toggle
                      checked={isEnabled}
                      onChange={(enabled) =>
                        onSportChange(sport.id, enabled)
                      }
                      disabled={isPending}
                      size="sm"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
              <BellOff size={28} className="mx-auto mb-2 text-gray-400" />
              <p className="font-medium text-gray-700">
                <Trans>Choose a skill level first</Trans>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                <Trans>Your sports will appear here for alert setup.</Trans>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SkillLegendItem({
  letter,
  color,
  title,
  description
}: {
  letter: string
  color: string
  title: React.ReactNode
  description: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
          color
        )}
      >
        {letter}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
    </div>
  )
}

function getSkillButtonClass(level: SkillLevel, isSelected: boolean) {
  if (!isSelected) {
    return 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }

  if (level === 'beginner') {
    return 'bg-green-500 text-white'
  }

  if (level === 'intermediate') {
    return 'bg-yellow-500 text-white'
  }

  return 'bg-red-500 text-white'
}
