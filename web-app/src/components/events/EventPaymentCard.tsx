import { Trans } from '@lingui/react/macro'
import { CoinsIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { generateQrPaymentString } from '../../lib/qrCodeGenerator'
import { getTotalReservedAwareHeadcount } from '../../utils/participants'
import type { Event } from '../../types'

export function EventPaymentCard({ event, bankAccount, className }: {
  event: Event
  bankAccount?: string
  className?: string
}) {
  const people = Math.max(1, event.minParticipants, getTotalReservedAwareHeadcount(event))
  // Round once so the visible amount and the encoded payment always agree.
  const amount = event.price && event.price > 0
    ? Number((event.price / people).toFixed(2))
    : undefined
  const currency = event.currency ?? 'CZK'
  const qrPayment = generateQrPaymentString({
    accountNumber: bankAccount,
    amount,
    currency,
    message: event.title
  })
  if (!event.price && !qrPayment) return null

  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="flex items-center text-xl font-semibold text-gray-900">
          <CoinsIcon size={20} className="mr-2 text-primary-600" />
          <Trans>Payment</Trans>
        </h2>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        {amount !== undefined && (
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-700"><Trans>Price total:</Trans></span>
              <span className="text-xl font-bold text-primary-600">{event.price} {currency}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-700"><Trans>Price per person ({people} people):</Trans></span>
              <span className="text-2xl font-bold text-primary-600">
                {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
              </span>
            </div>
          </div>
        )}
        {event.paymentDetails && (
          <p className="text-gray-600">
            <strong><Trans>Payment details:</Trans></strong> {event.paymentDetails}
          </p>
        )}
        {qrPayment && (
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="font-semibold text-gray-900"><Trans>QR payment</Trans></h3>
            <p className="text-sm text-gray-600"><Trans>Scan with your banking app to pay the organizer.</Trans></p>
            <QRCodeSVG
              value={qrPayment}
              size={240}
              level="M"
              marginSize={4}
              role="img"
              title="QR Platba"
              className="h-auto max-w-full rounded-lg border border-gray-200"
            />
            <p className="max-w-full break-all font-mono text-sm text-gray-700">{bankAccount}</p>
            <p className="text-xs text-gray-500">
              {amount === undefined
                ? <Trans>Enter the amount in your banking app.</Trans>
                : <Trans>The QR code includes the current price for one person.</Trans>}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
