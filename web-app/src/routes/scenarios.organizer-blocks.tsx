import { useCallback, useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { OrganizerBlocksCard } from '~/components/user/OrganizerBlocksCard'
import { BlockPlayerButton } from '~/components/user/BlockPlayerButton'
import { OrganizerBlockedPage } from '~/components/events/OrganizerBlockedPage'
import type { BlockableUser } from '~/lib/organizerBlocks'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { UserAvatar } from '~/components/user/UserAvatar'
import { Trans } from '@lingui/react/macro'

export const Route = createFileRoute('/scenarios/organizer-blocks')({
  beforeLoad: () => { if (!import.meta.env.DEV) throw notFound() },
  validateSearch: (search: Record<string, unknown>) => ({ blocked: search.blocked === true || search.blocked === 'true' }),
  component: OrganizerBlocksScenario
})

const players: BlockableUser[] = [
  { id: 'petr', name: 'Petr Novák' },
  { id: 'anna', name: 'Anna Dvořáková' }
]

function OrganizerBlocksScenario() {
  const { blocked } = Route.useSearch()
  const [blocks, setBlocks] = useState<BlockableUser[]>([])
  const [fail, setFail] = useState(false)
  const change = async (id: string, value: boolean) => {
    if (fail) throw new Error('Fixture failure')
    setBlocks((current) => value
      ? [...current.filter((player) => player.id !== id), players.find((player) => player.id === id)!]
      : current.filter((player) => player.id !== id))
  }
  const search = useCallback(async (query: string) => players.filter((player) =>
    player.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ), [])
  if (blocked) return <OrganizerBlockedPage />
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900"><Trans>Profile Settings</Trans></h1>
        <OrganizerBlocksCard blockedUsers={blocks} searchUsers={search} onChange={change} />
        <Card>
          <CardHeader><h2 className="text-lg font-semibold"><Trans>Who's Playing</Trans></h2></CardHeader>
          <CardContent className="space-y-3 p-6">
            {players.filter((player) => !blocks.some((block) => block.id === player.id)).map((player) => (
              <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={player} className="h-10 w-10" />
                  <span className="font-medium text-gray-900">{player.name}</span>
                </div>
                <BlockPlayerButton player={player} onBlock={(id) => change(id, true)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <label className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" checked={fail} onChange={(event) => setFail(event.target.checked)} />
          Simulate save failure
        </label>
      </div>
    </main>
  )
}
