import { useState } from 'react'
import { useLingui } from '@lingui/react'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { addDays, startOfDay } from 'date-fns'
import { Flame } from 'lucide-react'
import { EventCard } from '~/components/events/EventCard'
import { EventFilters } from '~/components/events/EventFilters'
import { UserProfile } from '~/components/user/UserProfile'
import { SkillLevelSettingsCard } from '~/components/user/SportsPreferencesCards'
import { AuthCard } from '~/components/auth/AuthCard'
import { PrivacyPolicy } from '~/pages/PrivacyPage'
import { TermsOfService } from '~/pages/TOSPage'
import type { Event, User, Venue } from '~/types'

export const Route = createFileRoute('/scenarios/localization')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: LocalizationScenario
})

const date = startOfDay(new Date())
const venues: Venue[] = ['Kotlářská 4', 'Janouškova 2'].map((address, index) => ({
  id: `venue-${index}`,
  name: address,
  address,
  city: 'Brno',
  country: 'Česko',
  lat: 49.2,
  lng: 16.61,
  type: 'indoor',
  sports: ['futsal'],
  facilities: ['restrooms', 'shower'],
  photos: [],
  price: 600,
  currency: 'CZK',
  createdBy: 'scenario',
  isVerified: true,
  createdAt: date,
  updatedAt: date
}))

const baseEvent: Event = {
  id: 'below-minimum',
  title: '',
  description: '',
  sport: 'futsal',
  venueId: 'venue-1',
  date: addDays(date, 5),
  startTime: '18:30',
  duration: 60,
  minParticipants: 10,
  idealParticipants: 14,
  maxParticipants: 16,
  cutoffTime: addDays(date, 5),
  price: 1450,
  currency: 'CZK',
  isPublic: true,
  organizerId: 'organizer',
  participants: Array.from({ length: 7 }, (_, i) => `player-${i}`),
  waitlist: [],
  participantPlusOnes: {},
  status: 'open',
  createdAt: date,
  updatedAt: date
}

const user: User = {
  id: 'player-0',
  name: 'Jan Novák',
  email: 'jan@example.com',
  bio: 'Rád si zahraju fotbal a volejbal.',
  karmaPoints: 128,
  skillLevels: { soccer: 'intermediate', volleyball: 'beginner' },
  notificationPreferences: {},
  preferredCurrency: 'CZK',
  createdAt: new Date('2025-04-01')
}

function LocalizationScenario() {
  const { i18n } = useLingui()
  const [screen, setScreen] = useState('events')
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>()
  const title = i18n._(msg`Futsal - Thursday - 18:30`)
  const belowMinimum = { ...baseEvent, title }
  const fullEvent: Event = {
    ...baseEvent,
    id: 'full-game',
    title: i18n._(msg`Monday futsal in a smaller hall`),
    venueId: 'venue-0',
    date: addDays(date, 2),
    startTime: '20:00',
    minParticipants: 6,
    idealParticipants: 8,
    maxParticipants: 8,
    reservedParticipants: 5,
    participants: ['player-0', 'player-1', 'player-2'],
    price: 600
  }

  return (
    <>
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <select
          aria-label={i18n._(msg`Preview`)}
          value={screen}
          onChange={(event) => setScreen(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="events"><Trans>Upcoming Events</Trans></option>
          <option value="profile"><Trans>My Profile</Trans></option>
          <option value="sign-in"><Trans>Sign In</Trans></option>
          <option value="sign-up"><Trans>Sign Up</Trans></option>
          <option value="privacy"><Trans>Privacy Policy</Trans></option>
          <option value="terms"><Trans>Terms of Service</Trans></option>
        </select>
      </div>
      {screen === 'events' && (
        <main className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-6 flex items-center text-2xl font-bold text-white">
              <Flame className="mr-3" size={28} />
              <Trans>Upcoming Events</Trans>
            </h1>
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2" data-testid="event-card-preview">
              <EventCard event={fullEvent} venues={venues} />
              <EventCard event={belowMinimum} venues={venues} />
            </section>
            <section className="mt-8 rounded-xl bg-white p-6">
              <EventFilters
                selectedSports={selectedSports}
                selectedSkillLevel={selectedSkillLevel}
                onSportToggle={(id) => setSelectedSports((current) => current.includes(id) ? current.filter((sport) => sport !== id) : [...current, id])}
                onSkillLevelChange={setSelectedSkillLevel}
                onClearSports={() => setSelectedSports([])}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <EventCard event={{ ...belowMinimum, id: 'participating', participants: [...baseEvent.participants, 'viewer'] }} venues={venues} currentUserId="viewer" />
                <EventCard event={{ ...belowMinimum, id: 'confirmed', minParticipants: 4, idealParticipants: undefined }} venues={venues} />
                <EventCard event={{ ...fullEvent, id: 'waitlisted', waitlist: ['viewer'] }} venues={venues} currentUserId="viewer" />
                <EventCard event={{ ...belowMinimum, id: 'joining' }} venues={venues} isJoining />
                <EventCard event={{ ...belowMinimum, id: 'ideal', minParticipants: 4 }} venues={venues} />
                <EventCard event={{ ...fullEvent, id: 'playing' }} venues={venues} currentUserId="player-0" />
              </div>
            </section>
          </div>
        </main>
      )}
      {screen === 'profile' && (
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <UserProfile user={user} />
            <SkillLevelSettingsCard skillLevels={user.skillLevels} onChange={() => {}} />
          </div>
        </main>
      )}
      {(screen === 'sign-in' || screen === 'sign-up') && <AuthCard pathname={screen} />}
      {screen === 'privacy' && <PrivacyPolicy />}
      {screen === 'terms' && <TermsOfService />}
    </>
  )
}
