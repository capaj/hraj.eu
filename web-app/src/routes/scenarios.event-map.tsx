import { createFileRoute, notFound } from '@tanstack/react-router'
import { EventMap } from '~/components/map/EventMap'
import type { Event, Venue } from '~/types'

export const Route = createFileRoute('/scenarios/event-map')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: EventMapScenario
})

const date = new Date()
date.setDate(date.getDate() + 1)

const venues: Venue[] = [
  { id: 'few', name: 'Letná', lat: 50.095, lng: 14.421 },
  { id: 'ideal', name: 'Karlín', lat: 50.089, lng: 14.45 },
  { id: 'full', name: 'Vinohrady', lat: 50.073, lng: 14.445 },
  { id: 'empty', name: 'Smíchov', lat: 50.069, lng: 14.407 },
  { id: 'group', name: 'Holešovice', lat: 50.106, lng: 14.441 }
].map((venue) => ({
  ...venue,
  address: venue.name,
  city: 'Praha',
  country: 'Česko',
  type: 'outdoor',
  sports: ['soccer'],
  facilities: [],
  photos: [],
  price: 0,
  currency: 'CZK',
  createdBy: 'scenario',
  isVerified: true,
  createdAt: date,
  updatedAt: date
}))

const events: Event[] = [
  { id: 'few', title: 'Looking for players', count: 3, sport: 'soccer' },
  { id: 'ideal', title: 'Ideal team size', count: 8, sport: 'volleyball' },
  { id: 'full', title: 'Full game', count: 10, sport: 'basketball' },
  { id: 'empty', title: 'Be the first to join', count: 0, sport: 'futsal' },
  { id: 'group', title: 'Game with guests and reserved places', count: 5, sport: 'soccer' }
].map(({ count, ...event }): Event => ({
  ...event,
  venueId: event.id,
  description: 'Map player gauge preview',
  date,
  startTime: '18:00',
  duration: 90,
  minParticipants: 4,
  idealParticipants: 8,
  maxParticipants: 10,
  cutoffTime: date,
  isPublic: true,
  organizerId: 'scenario',
  participants: Array.from({ length: count }, (_, index) => `player-${index}`),
  waitlist: [],
  participantPlusOnes: event.id === 'group' ? { 'player-0': ['Guest'] } : {},
  reservedParticipants: event.id === 'group' ? 2 : 0,
  status: 'open',
  createdAt: date,
  updatedAt: date
}))
events.push({ ...events[0], id: 'second-game', venueId: 'group', startTime: '20:00' })

function EventMapScenario() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Event player gauges</h1>
      <p className="mt-2 mb-5 text-gray-600">
        Below ideal · Ideal reached · At capacity · Empty game · Multiple events
        <br />
        Hover over the info button to see the legend, or focus it with the keyboard.
      </p>
      <div className="h-[640px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <EventMap events={events} venues={venues} />
      </div>
    </main>
  )
}
