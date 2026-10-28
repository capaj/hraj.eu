import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { Coins, Landmark, HandCoins } from 'lucide-react'

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
    <div
      data-testid="event-payment-settings"
      className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-gray-900">
          <Trans>Payment mode</Trans>
        </legend>
        <div className="space-y-3">
          <label
            className={`block cursor-pointer rounded-lg border bg-white p-4 ${mode === 'manual' && !requirePayment ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="payment-mode"
                value="none"
                disabled={disabled}
                checked={mode === 'manual' && !requirePayment}
                onChange={() => onChange('manual', false)}
              />
              <Coins size={17} />
              <Trans>No advance payment</Trans>
            </span>
            <p className="ml-6 mt-2 text-sm text-gray-600">
              <Trans>
                Attendance is confirmed when the player joins. Payment can be
                arranged later.
              </Trans>
            </p>
          </label>
          <label
            className={`block cursor-pointer rounded-lg border bg-white p-4 ${mode === 'manual' && requirePayment ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="payment-mode"
                value="honor"
                disabled={disabled}
                checked={mode === 'manual' && requirePayment}
                onChange={() => onChange('manual', true)}
              />
              <HandCoins size={17} />
              <Trans>Advance payment on trust</Trans>
            </span>
            <p className="ml-6 mt-2 text-sm text-gray-600">
              <Trans>
                The player checks “I have paid” after sending payment. This
                immediately confirms their attendance.
              </Trans>
            </p>
          </label>
          <label
            className={`block rounded-lg border bg-white p-4 ${fioConnected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${mode === 'fio' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}`}
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="payment-mode"
                value="fio"
                checked={mode === 'fio'}
                disabled={!fioConnected || disabled}
                onChange={() => onChange('fio', true)}
              />
              <Landmark size={17} />
              <Trans>Advance payment verified by Fio banka</Trans>
            </span>
            <p className="ml-6 mt-2 text-sm text-gray-600">
              <Trans>
                Each player gets a personal QR code. Attendance is confirmed
                only after the bank verifies payment.
              </Trans>
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
          <Trans>
            Save a read-only Fio API token with your bank account in your
            profile to enable bank verification.
          </Trans>{' '}
          <Link to="/user-profile" className="text-primary-700 underline">
            <Trans>Connect Fio in your profile</Trans>
          </Link>
        </p>
      )}
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
