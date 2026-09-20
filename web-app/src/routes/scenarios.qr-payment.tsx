import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Calendar, MapPin, User, Users } from 'lucide-react'
import { EventPaymentCard } from '../components/events/EventPaymentCard'
import { BankAccountHint } from '../components/user/BankAccountHint'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import type { Event } from '../types'

export const Route = createFileRoute('/scenarios/qr-payment')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: QrPaymentScenario
})

const event: Event = {
  id: 'qr-payment-scenario',
  title: 'Tuesday evening football',
  description: 'A friendly game at Sportcentrum Letňany. Bring a light and a dark shirt.',
  sport: 'soccer',
  venueId: 'scenario-venue',
  date: new Date('2026-09-22T18:30:00'),
  startTime: '18:30',
  duration: 90,
  minParticipants: 8,
  idealParticipants: 12,
  maxParticipants: 14,
  price: 1800,
  currency: 'CZK',
  paymentDetails: 'Please pay before the game.',
  cutoffTime: new Date('2026-09-22T12:00:00'),
  isPublic: true,
  organizerId: 'alex',
  participants: Array.from({ length: 12 }, (_, index) => `player-${index}`),
  participantPlusOnes: {},
  waitlist: [],
  status: 'confirmed',
  createdAt: new Date('2026-09-01'),
  updatedAt: new Date('2026-09-01')
}

function QrPaymentScenario() {
  const [bankAccount, setBankAccount] = useState('19-2000145399/0800')
  const [includePrice, setIncludePrice] = useState(true)
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <div className="text-white">
          <p className="mb-2 text-sm text-white/80">Football · Confirmed</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{event.title}</h1>
          <p className="mt-3 text-white/80">{event.description}</p>
        </div>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader><h2 className="text-xl font-semibold">Event Details</h2></CardHeader>
              <CardContent className="space-y-5 p-6 text-gray-700">
                <p className="flex items-center gap-3"><Calendar size={20} />22 September 2026 · 18:30</p>
                <p className="flex items-center gap-3"><MapPin size={20} />Sportcentrum Letňany, Prague</p>
                <p className="flex items-center gap-3"><Users size={20} />12 players · 90 minutes</p>
                <p className="flex items-center gap-3"><User size={20} />Organized by Alex Morgan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-xl font-semibold">Organizer’s profile</h2></CardHeader>
              <CardContent className="p-6">
                <label htmlFor="scenario-bank" className="mb-2 block text-sm font-medium text-gray-700">Czech Bank Account</label>
                <input
                  id="scenario-bank"
                  value={bankAccount}
                  onChange={(event) => setBankAccount(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono"
                />
                <BankAccountHint />
                <label className="mt-5 flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={includePrice} onChange={(event) => setIncludePrice(event.target.checked)} />
                  Include event price
                </label>
                <p className="mt-4 text-xs text-gray-400">Scenario preview · Changes stay in this browser.</p>
              </CardContent>
            </Card>
          </div>
          <EventPaymentCard event={{ ...event, price: includePrice ? event.price : undefined }} bankAccount={bankAccount} />
        </div>
      </div>
    </main>
  )
}
