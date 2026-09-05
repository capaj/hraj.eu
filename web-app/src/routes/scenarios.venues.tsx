import { createFileRoute, notFound } from '@tanstack/react-router'
import { VenuesPage } from '~/pages/VenuesPage'
import type { Venue } from '~/types'

const scenarioVenues: Venue[] = [
  {
    id: 'venue-stromovka',
    name: 'Beachklub Pankrác',
    address: 'Horáčkova 1100',
    city: 'Praha',
    country: 'Česko',
    lat: 50.0487,
    lng: 14.4382,
    type: 'outdoor',
    sports: ['beach-volleyball', 'volleyball'],
    facilities: ['shower', 'locker_room', 'food'],
    photos: [],
    description:
      'Outdoor beach courts with evening lighting, changing rooms, and a café.',
    price: 650,
    currency: 'CZK',
    createdBy: 'scenario-user',
    isVerified: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-08-21')
  },
  {
    id: 'venue-hagibor',
    name: 'Sportovní areál Hagibor',
    address: 'Izraelská 6',
    city: 'Praha',
    country: 'Česko',
    lat: 50.0787,
    lng: 14.4767,
    type: 'mixed',
    sports: ['soccer', 'futsal', 'tennis'],
    facilities: ['parking', 'shower', 'dressing_room'],
    photos: [],
    description:
      'Indoor and outdoor courts close to public transport in Vinohrady.',
    price: 900,
    currency: 'CZK',
    createdBy: 'scenario-user',
    isVerified: true,
    createdAt: new Date('2026-02-04'),
    updatedAt: new Date('2026-08-12')
  },
  {
    id: 'venue-luzanky',
    name: 'Sportovní park Lužánky',
    address: 'Lužánecká 7',
    city: 'Brno',
    country: 'Česko',
    lat: 49.2072,
    lng: 16.6076,
    type: 'outdoor',
    sports: ['basketball', 'volleyball', 'soccer'],
    facilities: ['restrooms', 'food'],
    photos: [],
    description:
      'Public outdoor courts surrounded by Brno’s largest city park.',
    price: 0,
    currency: 'CZK',
    createdBy: 'scenario-user',
    isVerified: true,
    createdAt: new Date('2026-03-18'),
    updatedAt: new Date('2026-07-30')
  },
  {
    id: 'venue-kralovka',
    name: 'Sportovní hala Královka',
    address: 'Nad Královskou oborou 51',
    city: 'Praha',
    country: 'Česko',
    lat: 50.1016,
    lng: 14.4235,
    type: 'indoor',
    sports: ['basketball', 'volleyball', 'floorball'],
    facilities: ['parking', 'locker_room', 'shower'],
    photos: [],
    price: 1200,
    currency: 'CZK',
    createdBy: 'scenario-user',
    isVerified: true,
    createdAt: new Date('2026-04-08'),
    updatedAt: new Date('2026-08-29')
  },
  {
    id: 'venue-cukrovar',
    name: 'Sportcentrum Cukrovar',
    address: 'Dobrovského 29',
    city: 'Kladno',
    country: 'Česko',
    lat: 50.1475,
    lng: 14.1029,
    type: 'indoor',
    sports: ['badminton', 'floorball', 'futsal'],
    facilities: ['parking', 'wifi', 'shower'],
    photos: [],
    price: 700,
    currency: 'CZK',
    createdBy: 'scenario-user',
    isVerified: true,
    createdAt: new Date('2026-04-25'),
    updatedAt: new Date('2026-08-20')
  },
  {
    id: 'venue-ladvi',
    name: 'Beach Ládví',
    address: 'Chabařovická 4',
    city: 'Praha',
    country: 'Česko',
    lat: 50.1251,
    lng: 14.4692,
    type: 'mixed',
    sports: ['beach-volleyball', 'volleyball'],
    facilities: ['food', 'shower', 'dressing_room'],
    photos: [],
    price: 750,
    currency: 'CZK',
    createdBy: 'scenario-user',
    isVerified: true,
    createdAt: new Date('2026-05-13'),
    updatedAt: new Date('2026-08-18')
  }
]

export const Route = createFileRoute('/scenarios/venues')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: VenuesScenario
})

function VenuesScenario() {
  return (
    <VenuesPage
      venues={scenarioVenues}
      initialSubscribedVenueIds={['venue-stromovka']}
      isAuthenticated
      onSignIn={() => undefined}
      onSubscriptionChange={async () => undefined}
    />
  )
}
