import { useEffect, useId, useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { ShieldBan, Search } from 'lucide-react'
import type { BlockableUser } from '~/lib/organizerBlocks'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { UserAvatar } from './UserAvatar'
import { BlockPlayerButton } from './BlockPlayerButton'

export function OrganizerBlocksCard({ blockedUsers, searchUsers, onChange, loading = false, loadFailed = false }: {
  blockedUsers: BlockableUser[]
  searchUsers: (query: string) => Promise<BlockableUser[]>
  onChange: (userId: string, blocked: boolean) => Promise<void>
  loading?: boolean
  loadFailed?: boolean
}) {
  const { t } = useLingui()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BlockableUser[]>([])
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [failed, setFailed] = useState(false)
  const [unblocking, setUnblocking] = useState<string>()
  useEffect(() => {
    let active = true
    setResults([])
    setSearchFailed(false)
    const value = query.trim()
    setSearching(value.length >= 2)
    if (value.length < 2) return
    const timeout = setTimeout(async () => {
      try {
        const users = await searchUsers(value)
        if (active) setResults(users)
      } catch {
        if (active) setSearchFailed(true)
      } finally {
        if (active) setSearching(false)
      }
    }, 250)
    return () => { active = false; clearTimeout(timeout) }
  }, [query, searchUsers])
  const block = async (id: string) => {
    await onChange(id, true)
    setQuery('')
  }
  const unblock = async (id: string) => {
    setUnblocking(id)
    setFailed(false)
    try { await onChange(id, false) } catch { setFailed(true) }
    finally { setUnblocking(undefined) }
  }
  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <ShieldBan size={22} className="text-primary-600" aria-hidden="true" />
          <Trans>Blocked players</Trans>
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600"><Trans>Blocked players cannot see or join your events and do not receive notifications about them.</Trans></p>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div>
          <label htmlFor={searchId} className="mb-2 block text-sm font-medium text-gray-900"><Trans>Block a player</Trans></label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" aria-hidden="true" />
            <input id={searchId} value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder={t`Search by name (at least 2 characters)`} maxLength={100}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div aria-live="polite">
            {searching && <p className="mt-3 text-sm text-gray-500"><Trans>Searching...</Trans></p>}
            {searchFailed && <p role="alert" className="mt-3 text-sm text-red-700"><Trans>Could not search players. Please try again.</Trans></p>}
            {!searching && !searchFailed && query.trim().length >= 2 && results.length === 0 && <p className="mt-3 text-sm text-gray-500"><Trans>No players found</Trans></p>}
          </div>
          {results.length > 0 && <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {results.filter((player) => !blockedUsers.some((blocked) => blocked.id === player.id)).map((player) => (
              <li key={player.id} className="flex items-center justify-between gap-3 p-3">
                <PlayerIdentity player={player} />
                <BlockPlayerButton player={player} onBlock={block} />
              </li>
            ))}
          </ul>}
        </div>
        <div className="border-t border-gray-100 pt-5" aria-live="polite">
          {loading && <p className="text-sm text-gray-500"><Trans>Loading...</Trans></p>}
          {!loading && loadFailed && (
            <p role="alert" className="text-sm text-red-700"><Trans>Could not load blocked players. Please reload the page.</Trans></p>
          )}
          {!loading && !loadFailed && blockedUsers.length === 0 && (
            <p className="text-sm text-gray-500"><Trans>You have not blocked any players.</Trans></p>
          )}
          {!loading && !loadFailed && blockedUsers.length > 0 && <ul className="space-y-3">
            {blockedUsers.map((player) => (
              <li key={player.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                <PlayerIdentity player={player} />
                <Button type="button" variant="outline" size="sm" disabled={!!unblocking}
                  aria-label={t`Unblock ${player.name}`} onClick={() => unblock(player.id)}>
                  {unblocking === player.id ? <Trans>Saving...</Trans> : <Trans>Unblock</Trans>}
                </Button>
              </li>
            ))}
          </ul>}
          {failed && <p role="alert" className="mt-3 text-sm text-red-700"><Trans>Could not update blocked players. Please try again.</Trans></p>}
        </div>
        <p className="text-xs leading-5 text-gray-500"><Trans>Unblocking restores access to your events. Cancelled bookings are not restored.</Trans></p>
      </CardContent>
    </Card>
  )
}

function PlayerIdentity({ player }: { player: BlockableUser }) {
  return <div className="flex min-w-0 items-center gap-3">
    <UserAvatar user={{ ...player, image: player.image ?? undefined }} className="h-10 w-10 shrink-0" />
    <span className="break-words text-sm font-medium text-gray-900">{player.name}</span>
  </div>
}
