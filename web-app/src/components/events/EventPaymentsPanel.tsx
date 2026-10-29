import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, Clock, Landmark, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { FioStatusMessage } from '../user/FioConnectionCard'
import { generateQrPaymentString } from '~/lib/qrCodeGenerator'
import { getEventPayments, refreshFioPayments } from '~/server-functions/fio'
import { markParticipantAsPaid } from '~/server-functions/markParticipantAsPaid'
import { unmarkParticipantAsPaid } from '~/server-functions/unmarkParticipantAsPaid'
import type { Event } from '~/types'

export type EventPayments = Awaited<ReturnType<typeof getEventPayments>>

export function EventPaymentsView({
  event,
  data,
  currentUserId,
  onRefresh,
  onVerify,
  busy = false
}: {
  event: Event
  data: EventPayments
  currentUserId?: string
  busy?: boolean
  onRefresh?: () => void
  onVerify?: (userId: string, paid: boolean) => void
}) {
  const { i18n } = useLingui()
  const [selectedId, setSelectedId] = useState<number>()
  const ownRequests = data.requests.filter(
    (request) => request.userId === currentUserId && !request.cancelledAt
  )
  const selected =
    ownRequests.find((request) => request.id === selectedId) ??
    ownRequests.find((request) => !request.paidAt) ??
    ownRequests[0]
  const pending = event.pendingPayment?.includes(currentUserId ?? '')
  const ownParticipant = data.participants.find(
    (participant) => participant.userId === currentUserId
  )
  const cancelled = event.status === 'cancelled'
  const amountDue = selected
    ? Math.max(selected.amountCents - selected.receivedCents, 0) / 100
    : 0
  const qr =
    selected && !selected.paidAt && !cancelled && data.connection?.connected
      ? generateQrPaymentString({
          accountNumber: data.connection.iban,
          amount: amountDue,
          currency: selected.currency,
          variableSymbol: selected.variableSymbol,
          message: event.title
        })
      : null
  const money = (cents: number) => (cents / 100).toFixed(2)
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Landmark className="text-primary-600" size={21} />
            {event.paymentMode === 'fio' ? (
              <Trans>Fio payments</Trans>
            ) : (
              <Trans>Payment confirmation</Trans>
            )}
          </h2>
          {data.isOrganizer && event.paymentMode === 'fio' && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={busy}
            >
              <RefreshCw size={15} className="mr-2" />
              <Trans>Check payments</Trans>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {event.paymentMode !== 'fio' &&
          ownParticipant?.paidAt &&
          !cancelled && (
            <p
              role="status"
              className="flex items-center gap-2 font-medium text-emerald-700"
            >
              <CheckCircle size={20} />
              <Trans>Marked as paid</Trans>
            </p>
          )}
        {pending && !cancelled && (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900"
          >
            <p className="flex items-center gap-2 font-semibold">
              <Clock size={18} />
              <Trans>Waiting for payment</Trans>
            </p>
            <p className="mt-1 text-sm">
              {event.paymentMode === 'fio' ? (
                <Trans>
                  Your place is held. Attendance is confirmed when payment for
                  you and your guests arrives.
                </Trans>
              ) : (
                <Trans>
                  Your place is held. Check “I have paid” after sending payment
                  to confirm your attendance.
                </Trans>
              )}
            </p>
          </div>
        )}
        {event.paymentMode !== 'fio' &&
          ownParticipant &&
          ['confirmed', 'pending_payment'].includes(ownParticipant.status) && (
            <label className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={!!ownParticipant.paidAt}
                disabled={busy || cancelled || !onVerify}
                onChange={(change) =>
                  onVerify?.(ownParticipant.userId, change.target.checked)
                }
              />
              <span>
                <strong className="block text-primary-900">
                  <Trans>I have paid</Trans>
                </strong>
                <span className="mt-1 block text-sm text-primary-800">
                  {ownParticipant.guests.length > 0 ? (
                    <Trans>I have sent payment for myself and my guests.</Trans>
                  ) : (
                    <Trans>I have sent my payment to the organizer.</Trans>
                  )}
                  {event.requirePayment && (
                    <>
                      {' '}
                      <Trans>
                        Checking this confirms your attendance immediately.
                      </Trans>
                    </>
                  )}
                </span>
              </span>
            </label>
          )}
        {cancelled && (
          <p
            role="status"
            className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            <Trans>
              This event is cancelled. Contact the organizer about any refund.
            </Trans>
          </p>
        )}
        {data.connection?.syncError && (
          <p
            role="alert"
            className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            <FioStatusMessage code={data.connection.syncError} />
          </p>
        )}
        {ownRequests.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {ownRequests.map((request) => (
              <Button
                key={request.id}
                variant={selected?.id === request.id ? 'primary' : 'outline'}
                onClick={() => setSelectedId(request.id)}
              >
                {request.playerName}
                {request.paidAt && <CheckCircle size={15} className="ml-2" />}
              </Button>
            ))}
          </div>
        )}
        {selected && (
          <div className="rounded-xl border border-gray-200 p-4 text-center">
            <p className="font-medium text-gray-900">{selected.playerName}</p>
            <p className="mt-2 text-3xl font-bold text-primary-700">
              {money(selected.amountCents)} {selected.currency}
            </p>
            {selected.paidAt ? (
              <p className="mt-4 flex items-center justify-center gap-2 font-medium text-emerald-700">
                <CheckCircle size={20} />
                <Trans>Payment received</Trans>
              </p>
            ) : (
              <>
                {selected.receivedCents > 0 && (
                  <p className="mt-2 text-sm text-amber-800">
                    <Trans>Received:</Trans> {money(selected.receivedCents)}{' '}
                    {selected.currency} · <Trans>Remaining:</Trans>{' '}
                    {amountDue.toFixed(2)} {selected.currency}
                  </p>
                )}
                {qr && (
                  <QRCodeSVG
                    value={qr}
                    size={220}
                    level="M"
                    marginSize={4}
                    role="img"
                    title={i18n._(msg`QR payment`)}
                    className="mx-auto mt-3 h-auto max-w-full"
                  />
                )}
                <p className="mt-2 text-sm text-gray-600">
                  <Trans>Variable symbol:</Trans>{' '}
                  <strong className="font-mono text-gray-900">
                    {selected.variableSymbol}
                  </strong>
                </p>
                <p className="mt-1 break-all font-mono text-sm text-gray-500">
                  {data.connection?.accountNumber}
                </p>
                {!cancelled && (
                  <p className="mt-3 text-xs text-gray-500">
                    <Trans>
                      Scan with your bank app. Keep the variable symbol so we
                      can match your payment.
                    </Trans>
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {!selected && !data.isOrganizer && event.paymentMode === 'fio' && (
          <p className="text-sm text-gray-600">
            <Trans>
              Your personal QR code appears after you join and a place becomes
              available.
            </Trans>
          </p>
        )}
        {data.isOrganizer && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="py-2 pr-4">
                    <Trans>Player</Trans>
                  </th>
                  <th className="py-2 pr-4">
                    <Trans>Payment</Trans>
                  </th>
                  <th className="py-2">
                    <Trans>Attendance</Trans>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {event.paymentMode === 'fio'
                  ? data.requests.map((request) => (
                      <tr key={request.id}>
                        <td className="py-3 pr-4">
                          <span className="font-medium text-gray-900">
                            {request.playerName}
                          </span>
                          <span className="mt-1 block font-mono text-xs text-gray-500">
                            VS {request.variableSymbol}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              request.paidAt
                                ? 'font-medium text-emerald-700'
                                : 'text-amber-800'
                            }
                          >
                            {money(request.receivedCents)} /{' '}
                            {money(request.amountCents)} {request.currency}
                          </span>
                          {request.receivedCents > 0 &&
                            (request.cancelledAt ||
                              cancelled ||
                              request.receivedCents > request.amountCents) && (
                              <span className="block text-xs text-amber-800">
                                <Trans>Review refund</Trans>
                              </span>
                            )}
                        </td>
                        <td className="py-3">
                          <AttendanceStatus
                            cancelled={!!request.cancelledAt || cancelled}
                            confirmed={
                              request.participantStatus === 'confirmed'
                            }
                          />
                        </td>
                      </tr>
                    ))
                  : data.participants
                      .filter((participant) =>
                        ['confirmed', 'pending_payment'].includes(
                          participant.status
                        )
                      )
                      .map((participant) => (
                        <tr key={participant.id}>
                          <td className="py-3 pr-4">
                            {participant.name}
                            {participant.guests.length > 0 &&
                              ` (+${participant.guests.length})`}
                          </td>
                          <td className="py-3 pr-4">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy || cancelled}
                              onClick={() =>
                                onVerify?.(
                                  participant.userId,
                                  !participant.paidAt
                                )
                              }
                            >
                              {participant.paidAt ? (
                                <Trans>Clear payment</Trans>
                              ) : (
                                <Trans>Confirm received</Trans>
                              )}
                            </Button>
                          </td>
                          <td className="py-3">
                            {participant.status === 'confirmed' ? (
                              <Trans>Confirmed</Trans>
                            ) : (
                              <Trans>Waiting for payment</Trans>
                            )}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-500">
              <Trans>Refunds are handled directly by the organizer.</Trans>
            </p>
          </div>
        )}
        {event.paymentMode === 'fio' && (
          <p className="text-xs text-gray-500">
            <Trans>
              Payments are checked every five minutes. Bank processing can take
              longer.
            </Trans>
            {data.connection?.lastSyncedAt && (
              <span className="mt-1 block">
                <Trans>Last successful check:</Trans>{' '}
                {new Date(data.connection.lastSyncedAt).toLocaleString(
                  i18n.locale
                )}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function EventPaymentsPanel({
  event,
  currentUserId
}: {
  event: Event
  currentUserId?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const query = useQuery({
    queryKey: ['event-payments', event.id, currentUserId],
    queryFn: () => getEventPayments({ data: { eventId: event.id } }),
    enabled: !!currentUserId,
    refetchInterval: 30_000
  })
  const ownStatus = query.data?.participants.find(
    (participant) => participant.userId === currentUserId
  )?.status
  useEffect(() => {
    const confirmed =
      query.data?.participants
        .filter((participant) => participant.status === 'confirmed')
        .map((participant) => participant.userId) ?? []
    if (confirmed.some((id) => event.pendingPayment?.includes(id)))
      void router.invalidate()
  }, [ownStatus, query.dataUpdatedAt, event.pendingPayment, router, query.data])
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(false)
    try {
      await action()
      await query.refetch()
      await router.invalidate()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }
  if (!currentUserId)
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">
          <Trans>Sign in and join to see your payment instructions.</Trans>
        </CardContent>
      </Card>
    )
  if (query.isError || error)
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p role="alert">
            <Trans>Could not load payment status. Please try again.</Trans>
          </p>
          <Button
            onClick={() => {
              setError(false)
              void query.refetch()
            }}
          >
            <Trans>Retry</Trans>
          </Button>
        </CardContent>
      </Card>
    )
  if (!query.data)
    return (
      <Card>
        <CardContent className="p-6">
          <Trans>Loading payments…</Trans>
        </CardContent>
      </Card>
    )
  return (
    <EventPaymentsView
      event={event}
      data={query.data}
      currentUserId={currentUserId}
      busy={busy}
      onRefresh={() => void act(() => refreshFioPayments())}
      onVerify={(userId, paid) =>
        void act(() =>
          paid
            ? markParticipantAsPaid({
                data: { eventId: event.id, targetUserId: userId }
              })
            : unmarkParticipantAsPaid({
                data: { eventId: event.id, targetUserId: userId }
              })
        )
      }
    />
  )
}

function AttendanceStatus({
  cancelled,
  confirmed
}: {
  cancelled: boolean
  confirmed: boolean
}) {
  if (cancelled) return <Trans>Cancelled</Trans>
  if (confirmed)
    return (
      <span className="text-emerald-700">
        <Trans>Confirmed</Trans>
      </span>
    )
  return (
    <span className="text-amber-800">
      <Trans>Waiting for payment</Trans>
    </span>
  )
}
