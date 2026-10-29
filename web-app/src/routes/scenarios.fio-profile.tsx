import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  FioConnectionCard,
  type FioConnection
} from '~/components/user/FioConnectionCard'

export const Route = createFileRoute('/scenarios/fio-profile')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: FioProfileScenario
})

const savedConnection: NonNullable<FioConnection> = {
  connected: true,
  iban: 'CZ0520100000002400222222',
  accountNumber: '2400222222/2010',
  currency: 'CZK',
  lastSyncedAt: new Date('2026-10-22T17:30:00Z'),
  syncError: null
}

function FioProfileScenario() {
  const [connection, setConnection] = useState<FioConnection>(savedConnection)
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-white">
          <h1 className="text-3xl font-bold">Můj profil</h1>
          <p className="mt-2 text-white/80">
            Fio účet propojený jednou pro všechny vaše události.
          </p>
        </div>
        <FioConnectionCard
          connection={connection}
          onSave={async () => {
            setConnection(savedConnection)
            return { error: null }
          }}
          onDisconnect={async () => setConnection(null)}
        />
      </div>
    </main>
  )
}
