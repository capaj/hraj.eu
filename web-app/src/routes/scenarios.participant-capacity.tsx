import { useState } from 'react'
import { Trans } from '@lingui/react/macro'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { ParticipantCapacityFields } from '~/components/events/ParticipantCapacityFields'
import {
  normalizeEventParticipantLimits,
  type EventParticipantLimits
} from '~/utils/eventParticipantLimits'

export const Route = createFileRoute('/scenarios/participant-capacity')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound()
    }
  },
  component: ParticipantCapacityScenario
})

function ParticipantCapacityScenario() {
  const [participantLimits, setParticipantLimits] =
    useState<EventParticipantLimits>(() =>
      normalizeEventParticipantLimits({
        minParticipants: 2,
        idealParticipants: 8,
        maxParticipants: 2
      })
    )

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8">
      <section className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-xl">
        <h1 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
          <Users size={20} className="mr-2" />
          <Trans>Participants</Trans>
        </h1>
        <ParticipantCapacityFields
          value={participantLimits}
          onChange={setParticipantLimits}
        />
      </section>
    </main>
  )
}
