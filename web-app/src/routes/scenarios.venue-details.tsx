import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { VenueDetailsPage } from '~/pages/VenueDetailsPage'
import type { Venue } from '~/types'
import type { VenueHistory } from '~/server-functions/venueHistory'

export const Route = createFileRoute('/scenarios/venue-details')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: VenueDetailsScenario
})

const venue: Venue = {
  id: 'venue-stromovka',
  name: 'Beachklub Pankrác',
  address: 'Horáčkova 1100',
  city: 'Praha',
  country: 'Česko',
  lat: 50.0487,
  lng: 14.4382,
  type: 'outdoor',
  sports: ['beach-volleyball', 'volleyball'],
  facilities: ['shower', 'locker_room', 'food', 'parking'],
  photos: ['/scenarios/venue-court.svg'],
  orientationPlan: '/scenarios/venue-court.svg',
  description:
    'Pískové kurty pro plážový volejbal s večerním osvětlením. Po hře si můžete odpočinout v kavárně přímo u kurtů.',
  accessInstructions:
    'Vstup do areálu je z Horáčkovy ulice. Recepce je hned za brankou, kurty najdete vlevo za kavárnou.',
  openingHours: {
    monday: { open: '08:00', close: '22:00' },
    tuesday: { open: '08:00', close: '22:00' },
    wednesday: { open: '08:00', close: '22:00' },
    thursday: { open: '08:00', close: '22:00' },
    friday: { open: '08:00', close: '23:00' },
    saturday: { open: '09:00', close: '21:00' },
    sunday: null
  },
  price: 450,
  currency: 'CZK',
  priceRange: { min: 450, max: 650, currency: 'CZK' },
  contactInfo: {
    phone: '+420 777 123 456',
    email: 'recepce@example.test',
    website: 'https://example.test'
  },
  rating: 4.8,
  totalRatings: 32,
  isVerified: true,
  createdBy: 'scenario',
  createdAt: new Date('2026-01-10'),
  updatedAt: new Date('2026-10-01')
}

const events: VenueHistory['events'] = Array.from(
  { length: 23 },
  (_, index) => ({
    id: `historical-event-${index}`,
    title:
      index === 0
        ? 'Podvečerní beach volejbal'
        : `Beach volejbal #${23 - index}`,
    sport: 'beach-volleyball',
    date: `2026-09-${String(30 - index).padStart(2, '0')}`,
    startTime: '18:00',
    duration: 90,
    status: index === 1 ? 'cancelled' : 'completed'
  })
)

function VenueDetailsScenario() {
  const [page, setPage] = useState(1)
  const [empty, setEmpty] = useState(false)
  return (
    <>
      <label className="block bg-white p-3 text-sm">
        <input
          type="checkbox"
          checked={empty}
          onChange={(event) => {
            setEmpty(event.target.checked)
            setPage(1)
          }}
        />{' '}
        Empty venue preview
      </label>
      <VenueDetailsPage
        venue={
          empty
            ? {
                ...venue,
                photos: [],
                description: undefined,
                accessInstructions: undefined,
                orientationPlan: undefined,
                openingHours: undefined,
                contactInfo: undefined,
                facilities: [],
                rating: undefined,
                price: 0,
                priceRange: undefined,
                lat: 0,
                lng: 0
              }
            : venue
        }
        history={{
          events: empty ? [] : events.slice((page - 1) * 20, page * 20),
          total: empty ? 0 : events.length,
          page
        }}
        onHistoryPageChange={setPage}
      />
    </>
  )
}
