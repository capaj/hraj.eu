import React, { useEffect, useMemo, useState } from 'react'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Ban, Clock3, Loader2, Search, ShieldAlert, Undo2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardHeader } from '~/components/ui/Card'
import { UserAvatar } from '~/components/user/UserAvatar'
import { i18n } from '~/lib/i18n'
import { clearEventJoinBan } from '~/server-functions/clearEventJoinBan'
import {
  getAdminEventBanUsers,
  type AdminEventBanUser
} from '~/server-functions/getAdminEventBanUsers'
import {
  setEventJoinBan,
  type EventJoinBanUnit
} from '~/server-functions/setEventJoinBan'

const DEFAULT_DURATION = '1'
const DEFAULT_UNIT: EventJoinBanUnit = 'weeks'

const isBanActive = (bannedUntil: Date | null) =>
  !!bannedUntil && new Date(bannedUntil).getTime() > Date.now()

const formatBanExpiry = (bannedUntil: Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(bannedUntil))

export const AdminEventBansPage: React.FC = () => {
  const [users, setUsers] = useState<AdminEventBanUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [durationByUserId, setDurationByUserId] = useState<
    Record<string, string>
  >({})
  const [unitByUserId, setUnitByUserId] = useState<
    Record<string, EventJoinBanUnit>
  >({})
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  const loadUsers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const response = await getAdminEventBanUsers()
      setIsAdmin(response.isAdmin)
      setUsers(response.users)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : i18n._(msg`Could not load users.`)
      )
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return users
      .filter(
        (user) =>
          !normalizedQuery ||
          user.name.toLocaleLowerCase().includes(normalizedQuery) ||
          user.email.toLocaleLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => {
        const activeBanDifference =
          Number(isBanActive(b.eventJoinBannedUntil)) -
          Number(isBanActive(a.eventJoinBannedUntil))

        return activeBanDifference || a.name.localeCompare(b.name)
      })
  }, [query, users])

  const activeBanCount = users.filter((user) =>
    isBanActive(user.eventJoinBannedUntil)
  ).length

  const getDuration = (userId: string) => durationByUserId[userId] ?? DEFAULT_DURATION
  const getUnit = (userId: string) => unitByUserId[userId] ?? DEFAULT_UNIT

  const setBan = async (userId: string) => {
    const duration = Number(getDuration(userId))

    if (!Number.isInteger(duration) || duration < 1 || duration > 3650) {
      toast.error(i18n._(msg`Enter a duration between 1 and 3650.`))
      return
    }

    setPendingUserId(userId)
    try {
      await setEventJoinBan({ data: { userId, duration, unit: getUnit(userId) } })
      await loadUsers(false)
      toast.success(i18n._(msg`Attendance ban updated.`))
    } catch (banError) {
      toast.error(
        banError instanceof Error
          ? banError.message
          : i18n._(msg`Could not update the attendance ban.`)
      )
    } finally {
      setPendingUserId(null)
    }
  }

  const clearBan = async (userId: string) => {
    setPendingUserId(userId)
    try {
      await clearEventJoinBan({ data: { userId } })
      await loadUsers(false)
      toast.success(i18n._(msg`Attendance ban removed.`))
    } catch (banError) {
      toast.error(
        banError instanceof Error
          ? banError.message
          : i18n._(msg`Could not remove the attendance ban.`)
      )
    } finally {
      setPendingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-primary-600" size={28} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-10 text-center">
              <ShieldAlert className="mx-auto mb-4 text-red-500" size={42} />
              <h1 className="text-2xl font-bold text-gray-900">
                <Trans>Administrator access required</Trans>
              </h1>
              <p className="mt-2 text-gray-600">
                <Trans>This page is only available to hraj.eu administrators.</Trans>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-primary-600" size={24} />
                  <h1 className="text-2xl font-bold text-gray-900">
                    <Trans>Attendance bans</Trans>
                  </h1>
                </div>
                <p className="mt-2 max-w-2xl text-gray-600">
                  <Trans>
                    Temporarily prevent a user from joining new games. They can
                    still browse hraj.eu and keep their existing attendances.
                  </Trans>
                </p>
              </div>
              <Badge variant="info" size="md" className="w-fit">
                <Users size={15} className="mr-1" />
                <Trans>{activeBanCount} active bans</Trans>
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <label className="sr-only" htmlFor="ban-user-search">
              <Trans>Search users</Trans>
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="ban-user-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={i18n._(msg`Search by name or email`)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              <Trans>Showing {filteredUsers.length} of {users.length} users</Trans>
            </p>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent className="p-6 text-red-700">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0 divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <Trans>No users match this search.</Trans>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const bannedUntil = user.eventJoinBannedUntil
                const activeBan = isBanActive(bannedUntil)
                const pending = pendingUserId === user.id
                const duration = Number(getDuration(user.id))
                const validDuration =
                  Number.isInteger(duration) && duration >= 1 && duration <= 3650

                return (
                  <div
                    key={user.id}
                    className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        user={user}
                        className="h-10 w-10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {user.email}
                        </p>
                        {bannedUntil && (
                          <p
                            className={`mt-1 flex items-center gap-1 text-xs ${
                              activeBan ? 'text-red-700' : 'text-gray-500'
                            }`}
                          >
                            <Clock3 size={13} />
                            {activeBan ? (
                              <Trans>Restricted until {formatBanExpiry(bannedUntil)}</Trans>
                            ) : (
                              <Trans>Restriction expired {formatBanExpiry(bannedUntil)}</Trans>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="grid grid-cols-[5.5rem_minmax(7.5rem,1fr)] gap-2">
                        <input
                          aria-label={i18n._(msg`Ban duration`)}
                          type="number"
                          min="1"
                          max="3650"
                          value={getDuration(user.id)}
                          onChange={(event) =>
                            setDurationByUserId((previous) => ({
                              ...previous,
                              [user.id]: event.target.value
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                        />
                        <select
                          aria-label={i18n._(msg`Ban duration unit`)}
                          value={getUnit(user.id)}
                          onChange={(event) =>
                            setUnitByUserId((previous) => ({
                              ...previous,
                              [user.id]: event.target.value as EventJoinBanUnit
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="days"><Trans>days</Trans></option>
                          <option value="weeks"><Trans>weeks</Trans></option>
                          <option value="months"><Trans>months</Trans></option>
                        </select>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending || !validDuration}
                        onClick={() => void setBan(user.id)}
                      >
                        {pending ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : (
                          <Ban size={15} className="mr-1" />
                        )}
                        {activeBan ? <Trans>Update ban</Trans> : <Trans>Ban</Trans>}
                      </Button>
                      {bannedUntil && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => void clearBan(user.id)}
                        >
                          <Undo2 size={15} className="mr-1" />
                          <Trans>Unban</Trans>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
