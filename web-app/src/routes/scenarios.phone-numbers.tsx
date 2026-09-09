import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  CheckCircle,
  Clock,
  Edit3,
  Mail,
  MapPin,
  Save,
  Settings,
  Share2,
  Trophy,
  User as UserIcon,
  Users
} from 'lucide-react'
import { AttendeePhoneNumber } from '~/components/events/AttendeePhoneNumber'
import { ProfilePhoneField } from '~/components/user/ProfilePhoneField'
import { SkillLevelSettingsCard } from '~/components/user/SportsPreferencesCards'
import { SkillLevelBadge } from '~/components/user/SkillLevelBadge'
import { UserAvatar } from '~/components/user/UserAvatar'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { SPORTS } from '~/lib/constants'

type PhoneNumbersScenarioSearch = {
  screen: 'profile' | 'event'
}

export const Route = createFileRoute('/scenarios/phone-numbers')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  validateSearch: (search): PhoneNumbersScenarioSearch => ({
    screen: search.screen === 'event' ? 'event' : 'profile'
  }),
  component: PhoneNumbersScenario
})

const scenarioUser = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+420 777 123 456'
}

const attendees = [
  {
    id: 'alex',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+420 777 123 456',
    skillLevel: 'intermediate' as const,
    organizer: true,
    paid: true,
    joined: 'Joined 6 days ago'
  },
  {
    id: 'jamie',
    name: 'Jamie Novák',
    email: 'jamie@example.com',
    phone: '+420 602 987 654',
    skillLevel: 'advanced' as const,
    organizer: false,
    paid: true,
    joined: 'Joined 4 days ago'
  },
  {
    id: 'taylor',
    name: 'Taylor Smith',
    email: 'taylor@example.com',
    skillLevel: 'beginner' as const,
    organizer: false,
    paid: false,
    joined: 'Joined yesterday'
  }
]

function PhoneNumbersScenario() {
  const { screen } = Route.useSearch()
  return screen === 'event' ? <EventDetailScreen /> : <ProfileScreen />
}

function ProfileScreen() {
  const [phone, setPhone] = useState(scenarioUser.phone)

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center text-3xl font-bold text-white">
            <UserIcon className="mr-3" size={32} />
            My Profile
          </h1>
          <p className="mt-2 text-white/80">
            Manage your account settings and sports preferences
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start space-x-8">
              <div className="relative flex-shrink-0">
                <UserAvatar
                  user={scenarioUser}
                  className="h-28 w-28 border-4 border-white shadow-lg"
                  fallbackClassName="text-3xl"
                />
                <button
                  type="button"
                  className="absolute bottom-1 right-1 rounded-full bg-primary-600 p-2 text-white shadow-lg"
                  aria-label="Change profile photo"
                >
                  <Edit3 size={15} />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-3xl font-bold text-gray-900">
                  {scenarioUser.name}
                </h2>
                <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600">
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2" />
                    {scenarioUser.email}
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    Prague, Czechia
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <Trans>Member since</Trans> April 2025
                  </div>
                </div>
                <div className="inline-flex items-center rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 px-5 py-2">
                  <Trophy className="mr-3 text-yellow-500" size={22} />
                  <div>
                    <div className="text-xl font-bold text-yellow-600">128</div>
                    <div className="text-xs text-gray-600">
                      <Trans>Karma Points</Trans>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-8 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center text-xl font-semibold text-gray-900">
                  <Settings size={20} className="mr-2" />
                  <Trans>Personal Information</Trans>
                </h3>
                <div className="flex space-x-3">
                  <Button variant="outline"><Trans>Cancel</Trans></Button>
                  <Button variant="primary">
                    <Save size={16} className="mr-2" />
                    <Trans>Save Changes</Trans>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                <ScenarioInput label="Full Name" value={scenarioUser.name} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <Trans>Email Address</Trans>
                  </label>
                  <div className="py-2 text-gray-900">{scenarioUser.email}</div>
                  <div className="text-xs text-gray-500">
                    <Trans>Contact support to change email</Trans>
                  </div>
                </div>
                <ProfilePhoneField
                  isEditing
                  phone={phone}
                  editedPhone={phone}
                  onChange={setPhone}
                />
                <ScenarioInput label="Location" value="Prague, Czechia" />
              </div>
            </CardContent>
          </Card>

          <SkillLevelSettingsCard
            skillLevels={{
              soccer: 'intermediate',
              basketball: 'beginner',
              volleyball: 'advanced'
            }}
            sports={SPORTS.slice(0, 3)}
            columns={1}
            onChange={() => undefined}
          />
        </div>
      </div>
    </main>
  )
}

function ScenarioInput({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>
  )
}

function EventDetailScreen() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button type="button" className="mb-6 flex items-center text-white/80">
          <ArrowLeft size={20} className="mr-2" />
          <Trans>Back to Events</Trans>
        </button>

        <div className="mb-8 flex items-start justify-between text-white">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="success" size="sm">Open</Badge>
              <Badge variant="default" size="sm">Football</Badge>
            </div>
            <h1 className="text-4xl font-bold">Tuesday evening football</h1>
            <p className="mt-2 text-white/80">
              Friendly weekly game at Sportcentrum Letňany
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <Share2 size={16} className="mr-2" />
            <Trans>Share</Trans>
          </Button>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                <Trans>Event Details</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  <Trans>About this event</Trans>
                </h3>
                <p className="leading-relaxed text-gray-700">
                  Relaxed seven-a-side football. We have the pitch booked and
                  changing rooms are available. Bring a light and a dark shirt.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="flex items-center font-semibold text-gray-900">
                    <Calendar size={18} className="mr-2 text-primary-600" />
                    <Trans>Date & Time</Trans>
                  </h3>
                  <div className="ml-6 space-y-3 text-gray-700">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-500" />
                      Tuesday, September 15, 2026
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-gray-500" />
                      18:30 (90 minutes)
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <CalendarPlus size={14} className="mr-1.5" />
                    <Trans>Add to Calendar</Trans>
                  </Button>
                </div>
                <div className="space-y-4">
                  <h3 className="flex items-center font-semibold text-gray-900">
                    <MapPin size={18} className="mr-2 text-primary-600" />
                    <Trans>Location</Trans>
                  </h3>
                  <div className="ml-6 text-gray-700">
                    <div className="font-medium">Sportcentrum Letňany</div>
                    <div className="mt-1 text-sm text-gray-500">
                      Tupolevova 710, Prague 9
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-gray-200 pt-6">
                <h3 className="mb-4 flex items-center font-semibold text-gray-900">
                  <Users size={18} className="mr-2 text-primary-600" />
                  <Trans>Player Requirements</Trans>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Requirement value="8" label="Minimum" />
                  <Requirement value="12" label="Ideal" tone="blue" />
                  <Requirement value="14" label="Maximum" tone="orange" />
                </div>
              </div>

              <div className="mt-7 border-t border-gray-200 pt-6">
                <h3 className="mb-4 flex items-center font-semibold text-gray-900">
                  <UserIcon size={18} className="mr-2 text-primary-600" />
                  <Trans>Organizer</Trans>
                </h3>
                <div className="flex items-center space-x-3">
                  <UserAvatar user={scenarioUser} className="h-12 w-12" />
                  <div>
                    <div className="font-medium text-gray-900">Alex Morgan</div>
                    <div className="text-sm text-gray-500">Karma points: 128</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6 text-center">
                  <div className="mb-3 flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-extrabold text-primary-600">5</span>
                    <span className="text-xl font-medium text-gray-400">/ 14</span>
                    <span className="text-sm font-medium text-gray-600">
                      <Trans>Players confirmed</Trans>
                    </span>
                  </div>
                  <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[36%] rounded-full bg-primary-600" />
                  </div>
                  <div className="text-xs text-gray-500">Ideal: 12 players</div>
                </div>
                <button
                  type="button"
                  className="mb-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left"
                >
                  <span className="flex items-center text-sm font-medium text-gray-700">
                    <Users size={16} className="mr-2 text-primary-600" />
                    <Trans>Bringing guests?</Trans>
                  </span>
                  <span className="text-xs text-gray-500">Up to 2 names</span>
                </button>
                <div
                  role="status"
                  className="flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-6 py-3 text-base font-medium text-primary-700"
                >
                  <CheckCircle size={20} className="mr-2" />
                  <Trans>You are playing</Trans>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="flex items-center text-lg font-semibold text-gray-900">
                  <UserIcon size={18} className="mr-2" />
                  <Trans>Who's Playing</Trans>
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-1">
                  {attendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="flex items-center rounded-lg bg-gray-50 p-3"
                    >
                      <UserAvatar user={attendee} className="mr-3 h-10 w-10" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-gray-900">
                            {attendee.name}
                          </div>
                          <SkillLevelBadge level={attendee.skillLevel} />
                          {attendee.organizer && (
                            <Badge variant="info" size="sm">
                              <Trans>Organizer</Trans>
                            </Badge>
                          )}
                          {attendee.paid && (
                            <CheckCircle
                              size={14}
                              className="text-green-600"
                              aria-label="Paid"
                            />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attendee.joined}
                        </div>
                        <AttendeePhoneNumber
                          name={attendee.name}
                          phone={attendee.phone}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function Requirement({
  value,
  label,
  tone = 'gray'
}: {
  value: string
  label: string
  tone?: 'gray' | 'blue' | 'orange'
}) {
  const styles = {
    gray: 'bg-gray-50 text-gray-900',
    blue: 'bg-blue-50 text-blue-900',
    orange: 'bg-orange-50 text-orange-900'
  }

  return (
    <div className={`rounded-lg p-3 text-center ${styles[tone]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}
