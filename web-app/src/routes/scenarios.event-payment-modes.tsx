import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  CreateEventForm,
  type CreateEventFormData
} from '~/components/events/CreateEventForm'
import {
  ConnectedFioCard,
  type FioConnection
} from '~/components/user/FioConnectionCard'
import { authSessionQueryKey } from '~/lib/auth-client'
import { fioConnectionQueryKey } from '~/lib/fio/queryKeys'
import type { Venue } from '~/types'

export const Route = createFileRoute('/scenarios/event-payment-modes')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: EventPaymentModesScenario
})

const connection: NonNullable<FioConnection> = {
  connected: true,
  accountNumber: '2400222222/2010',
  iban: 'CZ0520100000002400222222',
  currency: 'CZK',
  lastSyncedAt: null,
  syncError: null
}
const venue: Venue = {
  id: 'letnany',
  name: 'Sportovní areál Letňany',
  address: 'Tupolevova 710',
  city: 'Praha',
  country: 'CZ',
  lat: 50.126,
  lng: 14.507,
  type: 'outdoor',
  sports: ['football'],
  facilities: [],
  photos: [],
  price: 1800,
  currency: 'CZK',
  createdBy: 'organizer',
  isVerified: true,
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01')
}
const initialData: Partial<CreateEventFormData> = {
  title: 'Čtvrteční fotbal v Letňanech',
  sport: 'football',
  venueId: venue.id,
  date: '2026-11-05',
  startTime: '18:30',
  duration: 90,
  minParticipants: 8,
  idealParticipants: 12,
  maxParticipants: 14,
  price: 1800,
  currency: 'CZK'
}
const loadOptions = async () => ({ venues: [venue], coreGroups: [] })

function EventPaymentModesScenario() {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { enabled: false, staleTime: Infinity } }
    })
    client.setQueryData(authSessionQueryKey, { user: { id: 'organizer' } })
    client.setQueryData(fioConnectionQueryKey('organizer'), connection)
    client.setQueryData(fioConnectionQueryKey('other-organizer'), null)
    // Reproduce a tab that already contains the old, unscoped cache entry.
    client.setQueryData(['fio-connection'], connection)
    return client
  })
  const [connected, setConnected] = useState(true)
  const [locked, setLocked] = useState(false)
  const [submitted, setSubmitted] = useState('')
  const [userId, setUserId] = useState('organizer')
  const [view, setView] = useState('event')

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            Signed-in user
            <select
              aria-label="Signed-in user"
              value={userId}
              onChange={(change) => {
                const id = change.target.value
                setUserId(id)
                queryClient.setQueryData(
                  authSessionQueryKey,
                  id ? { user: { id } } : null
                )
                setConnected(
                  !!queryClient.getQueryData<FioConnection>(
                    fioConnectionQueryKey(id || undefined)
                  )?.connected
                )
                setSubmitted('')
              }}
            >
              <option value="organizer">Organizer with Fio</option>
              <option value="other-organizer">Another organizer</option>
              <option value="">Signed out</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            View
            <select
              aria-label="Preview view"
              value={view}
              onChange={(change) => setView(change.target.value)}
            >
              <option value="event">Create event</option>
              <option value="profile">Profile</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={connected}
              disabled={!userId}
              onChange={(change) => {
                setConnected(change.target.checked)
                queryClient.setQueryData(
                  fioConnectionQueryKey(userId),
                  change.target.checked ? connection : null
                )
                setSubmitted('')
              }}
            />
            Saved Fio token
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={locked}
              onChange={(change) => setLocked(change.target.checked)}
            />
            Payment settings locked
          </label>
          <output aria-label="Submitted payment settings">{submitted}</output>
        </div>
        <QueryClientProvider client={queryClient}>
          {view === 'profile' ? (
            <div
              data-testid="profile-fio-preview"
              className="mx-auto max-w-2xl"
            >
              <ConnectedFioCard />
            </div>
          ) : (
            <CreateEventForm
              key={String(connected)}
              isEdit={false}
              paymentSettingsLocked={locked}
              initialData={initialData}
              loadOptions={loadOptions}
              onSubmit={(data) =>
                setSubmitted(`${data.paymentMode}:${data.requirePayment}`)
              }
              onCancel={() => {}}
            />
          )}
        </QueryClientProvider>
      </div>
    </main>
  )
}
