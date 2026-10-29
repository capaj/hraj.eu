import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { useAuthSession } from '~/lib/auth-client'
import { fioConnectionQueryKey } from '~/lib/fio/queryKeys'
import { Landmark, ShieldCheck, Unplug } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  disconnectFio,
  getFioConnection,
  saveFioConnection
} from '~/server-functions/fio'

export type FioConnection = Awaited<ReturnType<typeof getFioConnection>> | null

export function FioStatusMessage({ code }: { code: string }) {
  if (code === 'rate_limited')
    return <Trans>Fio is busy. Wait two minutes before trying again.</Trans>
  if (code === 'token_unavailable' || code === 'invalid_token')
    return (
      <Trans>
        Check the token and its expiry date. New Fio tokens take five minutes to
        activate.
      </Trans>
    )
  if (code === 'account_changed')
    return (
      <Trans>
        This account is linked to existing events. Use a token for the same bank
        account.
      </Trans>
    )
  if (code === 'unsupported_account')
    return <Trans>Connect a Czech Fio account in CZK.</Trans>
  if (code === 'token_in_use')
    return <Trans>This token is already connected to another user.</Trans>
  if (code === 'disconnected')
    return (
      <Trans>
        Automatic payment checks are paused. Reconnect the account to resume.
      </Trans>
    )
  if (code === 'history_gap')
    return (
      <Trans>
        Older bank history was unavailable. Review payments older than 90 days
        manually.
      </Trans>
    )
  return (
    <Trans>
      Payment checks could not complete. Check your token or try again later.
    </Trans>
  )
}

export function FioConnectionCard({
  connection,
  onSave,
  onDisconnect,
  loading = false
}: {
  connection: FioConnection
  onSave: (token: string) => Promise<{ error: string | null }>
  onDisconnect: () => Promise<void>
  loading?: boolean
}) {
  const [token, setToken] = useState('')
  const [readOnly, setReadOnly] = useState(false)
  const [editingToken, setEditingToken] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  let buttonLabel = <Trans>Connect Fio account</Trans>
  if (connection?.connected) buttonLabel = <Trans>Replace token</Trans>
  if (busy) buttonLabel = <Trans>Connecting…</Trans>
  const connectionFailed = 'connection_failed'
  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Landmark className="text-primary-600" size={22} />
          <Trans>Fio banka integration</Trans>
        </h2>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-gray-600">
          <Trans>
            Connect Fio once in your profile with a read-only API token. Every
            event you organize can use this saved connection.
          </Trans>
        </p>
        {connection?.connected && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={18} />
              <Trans>Account connected</Trans>
            </p>
            <p className="mt-1 font-mono text-sm">
              {connection.accountNumber} · {connection.currency}
            </p>
          </div>
        )}
        {(error || connection?.syncError) && (
          <p
            role="alert"
            className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            <FioStatusMessage code={(error || connection?.syncError)!} />
          </p>
        )}
        {(!connection?.connected || editingToken) && (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setBusy(true)
              setError(null)
              try {
                const result = await onSave(token.trim())
                setError(result.error)
                if (!result.error) {
                  setToken('')
                  setReadOnly(false)
                  setEditingToken(false)
                }
              } catch {
                setError(connectionFailed)
              } finally {
                setBusy(false)
              }
            }}
          >
            <div>
              <label
                htmlFor="fio-token"
                className="mb-1 block text-sm font-medium"
              >
                <Trans>Read-only API token</Trans>
              </label>
              <input
                id="fio-token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                minLength={64}
                maxLength={64}
                pattern="[a-zA-Z0-9]{64}"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono"
              />
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                <Trans>
                  In Fio Internetbanking, open Settings → API and create a token
                  with “Sledování účtu” permission. Wait five minutes after
                  creating it.
                </Trans>
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                required
                checked={readOnly}
                onChange={(event) => setReadOnly(event.target.checked)}
                className="mt-1"
              />
              <Trans>I created this token with read-only access.</Trans>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={
                  busy || loading || !readOnly || token.trim().length !== 64
                }
              >
                {buttonLabel}
              </Button>
            </div>
          </form>
        )}
        {connection?.connected && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditingToken(!editingToken)
                setToken('')
                setReadOnly(false)
                setError(null)
              }}
            >
              {editingToken ? (
                <Trans>Cancel</Trans>
              ) : (
                <Trans>Replace token</Trans>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onDisconnect()
                  setEditingToken(false)
                } catch {
                  setError(connectionFailed)
                } finally {
                  setBusy(false)
                }
              }}
            >
              <Unplug size={16} className="mr-2" />
              <Trans>Disconnect</Trans>
            </Button>
          </div>
        )}
        <p className="text-xs text-gray-500">
          <Trans>
            Your token is stored encrypted. hraj.eu reads payments and cannot
            send transfers. Disconnecting pauses payment checks for your events.
          </Trans>
        </p>
        <a
          className="text-xs text-primary-700 underline"
          href="https://www.fio.cz/bankovni-sluzby/api-bankovnictvi"
          target="_blank"
          rel="noreferrer"
        >
          <Trans>Fio API setup guide</Trans>
        </a>
      </CardContent>
    </Card>
  )
}

export function ConnectedFioCard() {
  const session = useAuthSession()
  const userId = session.data?.user?.id
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: fioConnectionQueryKey(userId),
    queryFn: () => getFioConnection(),
    enabled: !!userId
  })
  if (!userId) return null
  if (query.isError)
    return (
      <p role="alert">{i18n._(msg`Could not load your Fio connection.`)}</p>
    )
  return (
    <FioConnectionCard
      key={userId}
      connection={query.data ?? null}
      loading={query.isPending}
      onSave={async (token) => {
        const result = await saveFioConnection({
          data: { token, readOnlyAcknowledged: true }
        })
        await queryClient.invalidateQueries({
          queryKey: fioConnectionQueryKey(userId)
        })
        return result
      }}
      onDisconnect={async () => {
        await disconnectFio()
        await queryClient.invalidateQueries({
          queryKey: fioConnectionQueryKey(userId)
        })
      }}
    />
  )
}
