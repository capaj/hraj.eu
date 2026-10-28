import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventCard } from '~/components/events/EventCard'
import { JoinActionCard } from '~/components/events/JoinActionCard'
import { UploadedPaymentQrCodes } from '~/components/events/UploadedPaymentQrCodes'
import {
  EventPaymentsView,
  type EventPayments
} from '~/components/events/EventPaymentsPanel'
import {
  applyEventParticipantsUpdate,
  type EventParticipantsUpdate
} from '~/utils/participants'
import { authSessionQueryKey } from '~/lib/auth-client'
import type { Event } from '~/types'

export const Route = createFileRoute('/scenarios/pending-payments')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: PendingPaymentsScenario
})

const initialEvent: Event = {
  id: 'pending-payment-preview',
  title: 'Večerní badminton v Letňanech',
  description: 'Přihlaste se, pošlete 150 Kč a potvrďte svou platbu.',
  sport: 'badminton',
  venueId: 'letnany',
  date: new Date('2026-11-05'),
  startTime: '18:30',
  duration: 90,
  minParticipants: 2,
  idealParticipants: 2,
  maxParticipants: 3,
  price: 300,
  currency: 'CZK',
  pricePerPersonCents: 15000,
  paymentMode: 'manual',
  requirePayment: true,
  organizerId: 'organizer',
  participants: ['organizer', 'jan'],
  pendingPayment: [],
  waitlist: ['petr'],
  participantPlusOnes: { petr: ['Host'] },
  qrCodeImages: ['/scenarios/trust-payment.svg'],
  cutoffTime: new Date('2026-11-05T16:30:00Z'),
  isPublic: true,
  status: 'open',
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01')
}

const bookingUpdate = (paid: boolean): EventParticipantsUpdate => ({
  confirmed: paid ? ['organizer', 'jan', 'anna'] : ['organizer', 'jan'],
  pendingPayment: paid ? [] : ['anna'],
  waitlisted: ['petr'],
  plusAttendees: { petr: ['Host'] },
  guests: { petr: [{ name: 'Host' }] },
  participantJoinedAt: {},
  waitlistJoinedAt: {}
})

function PendingPaymentsScenario() {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { enabled: false } }
    })
    client.setQueryData(authSessionQueryKey, { user: { id: 'anna' } })
    return client
  })
  const [event, setEvent] = useState(initialEvent)
  const [viewer, setViewer] = useState('anna')
  const [joinRequests, setJoinRequests] = useState(0)
  const [selectedQr, setSelectedQr] = useState('')
  const joined =
    event.pendingPayment?.includes('anna') ||
    event.participants.includes('anna')
  const paidAt = event.participants.includes('anna')
    ? new Date('2026-10-28T12:00:00Z')
    : null
  const payments: EventPayments = {
    isOrganizer: false,
    connection: null,
    requests: [],
    participants: joined
      ? [
          {
            id: 3,
            userId: 'anna',
            name: 'Anna Dvořáková',
            status: paidAt ? 'confirmed' : 'pending_payment',
            paidAt,
            guests: []
          }
        ]
      : []
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="text-white">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="mt-2 text-white/80">
            5. listopadu · 18:30 · 150 Kč / hráč
          </p>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <EventCard
              event={event}
              currentUserId={viewer || undefined}
              onJoin={() => {
                setJoinRequests((count) => count + 1)
                setEvent((previous) =>
                  applyEventParticipantsUpdate(previous, bookingUpdate(false))
                )
              }}
            />
            {joined && viewer === 'anna' && (
              <QueryClientProvider client={queryClient}>
                <JoinActionCard event={event} onParticipantsChange={() => {}} />
              </QueryClientProvider>
            )}
          </div>
          <div className="space-y-6">
            <UploadedPaymentQrCodes
              event={event}
              currentUserId={viewer || undefined}
              onSelect={setSelectedQr}
            />
            {joined && viewer === 'anna' && (
              <EventPaymentsView
                event={event}
                data={payments}
                currentUserId="anna"
                onVerify={(_id, paid) =>
                  setEvent((previous) =>
                    applyEventParticipantsUpdate(previous, bookingUpdate(paid))
                  )
                }
              />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 text-sm text-gray-600">
          <label>
            Current viewer{' '}
            <select
              aria-label="Current viewer"
              value={viewer}
              onChange={(change) => {
                setViewer(change.target.value)
                setSelectedQr('')
                queryClient.setQueryData(
                  authSessionQueryKey,
                  change.target.value
                    ? { user: { id: change.target.value } }
                    : null
                )
              }}
            >
              <option value="anna">Anna</option>
              <option value="petr">Waitlisted player</option>
              <option value="">Anonymous visitor</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={event.paymentMode === 'fio'}
              onChange={(change) =>
                setEvent((previous) => ({
                  ...previous,
                  paymentMode: change.target.checked ? 'fio' : 'manual'
                }))
              }
            />{' '}
            Use Fio verification
          </label>
          <output aria-label="Join requests">{joinRequests}</output>
          <output aria-label="Selected QR image">{selectedQr}</output>
        </div>
      </div>
    </main>
  )
}
