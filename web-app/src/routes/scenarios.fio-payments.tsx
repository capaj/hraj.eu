import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { authSessionQueryKey } from '~/lib/auth-client'
import { JoinActionCard } from '~/components/events/JoinActionCard'
import { PendingPaymentParticipants } from '~/components/events/PendingPaymentParticipants'
import type { FioConnection } from '~/components/user/FioConnectionCard'
import { EventPaymentSettings } from '~/components/events/EventPaymentSettings'
import {
  EventPaymentsView,
  type EventPayments
} from '~/components/events/EventPaymentsPanel'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'
import type { Event } from '~/types'

export const Route = createFileRoute('/scenarios/fio-payments')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: FioPaymentsScenario
})

const initialConnection: NonNullable<FioConnection> = {
  connected: true,
  iban: 'CZ0520100000002400222222',
  accountNumber: '2400222222/2010',
  currency: 'CZK',
  lastSyncedAt: new Date('2026-10-22T17:30:00Z'),
  syncError: null
}
const event: Event = {
  id: 'fio-preview',
  title: 'Čtvrteční fotbal v Letňanech',
  description: '',
  sport: 'football',
  venueId: 'preview',
  date: new Date('2026-10-29'),
  startTime: '18:30',
  duration: 90,
  minParticipants: 8,
  idealParticipants: 12,
  maxParticipants: 14,
  price: 1800,
  currency: 'CZK',
  pricePerPersonCents: 15000,
  paymentMode: 'fio',
  requirePayment: true,
  pendingPayment: ['anna', 'petr'],
  cutoffTime: new Date('2026-10-29T16:30:00Z'),
  isPublic: true,
  organizerId: 'organizer',
  participants: ['jan'],
  participantPlusOnes: {},
  waitlist: [],
  status: 'open',
  createdAt: new Date('2026-10-20'),
  updatedAt: new Date('2026-10-20')
}
const initialRequests: EventPayments['requests'] = [
  {
    id: 1,
    variableSymbol: '1000000001',
    playerName: 'Jan Novák',
    userId: 'jan',
    amountCents: 15000,
    currency: 'CZK',
    receivedCents: 15000,
    paidAt: new Date('2026-10-22T17:20:00Z'),
    cancelledAt: null,
    participantStatus: 'confirmed'
  },
  {
    id: 2,
    variableSymbol: '1000000002',
    playerName: 'Anna Dvořáková',
    userId: 'anna',
    amountCents: 15000,
    currency: 'CZK',
    receivedCents: 0,
    paidAt: null,
    cancelledAt: null,
    participantStatus: 'pending_payment'
  },
  {
    id: 3,
    variableSymbol: '1000000003',
    playerName: 'Petr Svoboda',
    userId: 'petr',
    amountCents: 15000,
    currency: 'CZK',
    receivedCents: 5000,
    paidAt: null,
    cancelledAt: null,
    participantStatus: 'pending_payment'
  }
]

function FioPaymentsScenario() {
  const [previewQueries] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { enabled: false } }
    })
    client.setQueryData(authSessionQueryKey, { user: { id: 'anna' } })
    return client
  })
  const connection = initialConnection
  const [mode, setMode] = useState<'manual' | 'fio'>('fio')
  const [requirePayment, setRequirePayment] = useState(true)
  const [requests, setRequests] = useState(initialRequests)
  const [cancelled, setCancelled] = useState(false)
  const previewEvent = {
    ...event,
    paymentMode: mode,
    requirePayment,
    status: cancelled ? ('cancelled' as const) : ('open' as const),
    pendingPayment: requests
      .filter((request) => request.participantStatus === 'pending_payment')
      .map((request) => request.userId),
    participants: requests
      .filter((request) => request.participantStatus === 'confirmed')
      .map((request) => request.userId)
  }
  const data: EventPayments = {
    isOrganizer: true,
    connection,
    requests: mode === 'fio' ? requests : [],
    participants: requests.map((request) => ({
      id: request.id,
      userId: request.userId,
      name: request.playerName,
      status:
        request.participantStatus as EventPayments['participants'][number]['status'],
      paidAt: request.paidAt,
      guests: []
    }))
  }
  const confirm = (userId: string, paid: boolean) =>
    setRequests((previous) =>
      previous.map((request) =>
        request.userId === userId
          ? {
              ...request,
              receivedCents: paid ? request.amountCents : 0,
              paidAt: paid ? new Date() : null,
              participantStatus: paid ? 'confirmed' : 'pending_payment'
            }
          : request
      )
    )
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-white">
          <p className="text-sm text-white/80">FIO BANKA · HRAJ.EU</p>
          <h1 className="mt-2 text-3xl font-bold">{event.title}</h1>
          <p className="mt-2 text-white/80">
            29. října · 18:30 · 150 Kč / hráč
          </p>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Nastavení události</h2>
              </CardHeader>
              <CardContent className="p-6">
                <EventPaymentSettings
                  mode={mode}
                  requirePayment={requirePayment}
                  fioConnected={!!connection?.connected}
                  amountCents={15000}
                  onChange={(nextMode, nextRequired) => {
                    setMode(nextMode)
                    setRequirePayment(nextRequired)
                    setRequests((previous) =>
                      previous.map((request) => {
                        let participantStatus: EventPayments['requests'][number]['participantStatus'] =
                          'confirmed'
                        if (request.cancelledAt) participantStatus = 'cancelled'
                        else if (nextRequired && !request.paidAt)
                          participantStatus = 'pending_payment'
                        return { ...request, participantStatus }
                      })
                    )
                  }}
                />
              </CardContent>
            </Card>
            <QueryClientProvider client={previewQueries}>
              <JoinActionCard
                event={previewEvent}
                onParticipantsChange={() => {}}
              />
            </QueryClientProvider>
            <PendingPaymentParticipants
              players={requests
                .filter(
                  (request) => request.participantStatus === 'pending_payment'
                )
                .map((request) => ({
                  id: request.userId,
                  name: request.playerName
                }))}
              currentUserId="organizer"
              organizerId="organizer"
              onCancel={(userId) =>
                setRequests((previous) =>
                  previous.map((request) =>
                    request.userId === userId
                      ? {
                          ...request,
                          participantStatus: 'cancelled',
                          cancelledAt: new Date()
                        }
                      : request
                  )
                )
              }
            />
          </div>
          <div className="space-y-6">
            <EventPaymentsView
              event={previewEvent}
              data={{
                ...data,
                isOrganizer: false,
                requests: data.requests.filter(
                  (request) => request.userId === 'anna'
                )
              }}
              currentUserId="anna"
              onVerify={confirm}
            />
            <EventPaymentsView
              event={previewEvent}
              data={data}
              currentUserId="organizer"
              onRefresh={() => confirm('anna', true)}
              onVerify={confirm}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/95 p-4">
          <span className="text-sm text-gray-600">
            Scenario controls · browser-only fixtures
          </span>
          <Button variant="outline" onClick={() => confirm('anna', true)}>
            Simulate Anna’s payment
          </Button>
          <Button variant="outline" onClick={() => setCancelled(!cancelled)}>
            Toggle cancellation
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRequests(initialRequests)
              setCancelled(false)
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </main>
  )
}
