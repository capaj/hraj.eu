import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { Landmark, HandCoins } from 'lucide-react'

export function EventPaymentSettings({
  mode,
  requirePayment,
  fioConnected,
  amountCents,
  onChange,
  disabled = false,
  currency = 'CZK'
}: {
  disabled?: boolean
  currency?: string
  mode: 'manual' | 'fio'
  requirePayment: boolean
  fioConnected: boolean
  amountCents?: number
  onChange: (mode: 'manual' | 'fio', requirePayment: boolean) => void
}) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-gray-900">
          <Trans>Payment tracking</Trans>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-lg border bg-white p-3 ${mode === 'manual' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="payment-mode"
                disabled={disabled}
                checked={mode === 'manual'}
                onChange={() => onChange('manual', requirePayment)}
              />
              <HandCoins size={17} />
              <Trans>Manual</Trans>
            </span>
            <p className="mt-2 text-xs text-gray-500">
              <Trans>You check and confirm payments.</Trans>
            </p>
          </label>
          <label
            className={`rounded-lg border bg-white p-3 ${fioConnected ? 'cursor-pointer' : 'opacity-60'} ${mode === 'fio' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="payment-mode"
                checked={mode === 'fio'}
                disabled={!fioConnected || disabled}
                onChange={() => onChange('fio', requirePayment)}
              />
              <Landmark size={17} />
              <Trans>Fio banka</Trans>
            </span>
            <p className="mt-2 text-xs text-gray-500">
              <Trans>Personal QR codes and automatic bank checks.</Trans>
            </p>
          </label>
        </div>
      </fieldset>
      {fioConnected && mode === 'fio' && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <Trans>
            Uses the Fio account saved in your profile. You do not need to enter
            the token again.
          </Trans>{' '}
          <Link to="/user-profile" className="font-medium underline">
            <Trans>Manage Fio connection</Trans>
          </Link>
        </p>
      )}
      {!fioConnected && (
        <p className="text-sm text-gray-600">
          <Link to="/user-profile" className="text-primary-700 underline">
            <Trans>Connect Fio in your profile</Trans>
          </Link>
        </p>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          disabled={disabled}
          checked={requirePayment}
          onChange={(event) => onChange(mode, event.target.checked)}
        />
        <span>
          <strong className="block text-gray-900">
            <Trans>Require payment before confirming attendance</Trans>
          </strong>
          <span className="mt-1 block text-gray-500">
            <Trans>
              A place is held while payment is pending. Only paid players count
              toward the event minimum.
            </Trans>
          </span>
        </span>
      </label>
      {(mode === 'fio' || requirePayment) && (
        <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-900">
          <Trans>Fixed price per player:</Trans>{' '}
          <strong>
            {amountCents ? (amountCents / 100).toFixed(2) : '—'} {currency}
          </strong>
          <br />
          <span className="text-xs">
            <Trans>
              Based on total price and ideal player count (or maximum). Payment
              settings are locked after the first registration.
            </Trans>
          </span>
        </p>
      )}
    </div>
  )
}
