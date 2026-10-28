import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import type { Event } from '~/types'

export function UploadedPaymentQrCodes({
  event,
  currentUserId,
  onSelect
}: {
  event: Event
  currentUserId?: string
  onSelect: (image: string) => void
}) {
  const { i18n } = useLingui()
  if (!event.qrCodeImages?.length) return null
  const confirmed =
    !!currentUserId && event.participants.includes(currentUserId)
  const pendingTrustPayment =
    !!currentUserId &&
    event.paymentMode !== 'fio' &&
    event.requirePayment &&
    ['open', 'confirmed'].includes(event.status) &&
    event.pendingPayment?.includes(currentUserId)

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center text-xl font-semibold text-gray-900">
          <ImageIcon size={18} className="mr-2 text-primary-600" />
          <Trans>QR Codes</Trans>
        </h2>
      </CardHeader>
      <CardContent className="p-6">
        {confirmed || pendingTrustPayment ? (
          <>
            <p className="mb-4 text-sm text-gray-600">
              <Trans>Click a QR code to view it larger.</Trans>
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {event.qrCodeImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => onSelect(image)}
                  className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-shadow hover:shadow-md"
                >
                  <img
                    src={image}
                    alt={i18n._(msg`QR code image ${index + 1}`)}
                    className="h-40 w-full object-contain"
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            <Trans>QR codes are displayed only to participants.</Trans>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
