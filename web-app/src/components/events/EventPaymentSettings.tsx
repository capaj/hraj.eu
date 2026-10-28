import { useId, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { Coins, Landmark, HandCoins, X } from 'lucide-react'
import { Button } from '../ui/Button'

type PaymentChoice = 'none' | 'manual' | 'fio'

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
  let currentChoice: PaymentChoice = 'none'
  if (mode === 'fio') currentChoice = 'fio'
  else if (requirePayment) currentChoice = 'manual'

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PaymentChoice>(currentChoice)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) dialog.current?.showModal()
  }, [open])

  const close = () => {
    dialog.current?.close()
    setOpen(false)
  }

  return (
    <>
      <div
        data-testid="event-payment-settings"
        className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
      >
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            <Trans>Payment mode</Trans>
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
            <PaymentModeLabel choice={currentChoice} />
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={disabled}
          aria-expanded={open}
          onClick={() => {
            setDraft(currentChoice)
            setOpen(true)
          }}
        >
          <Trans>Change</Trans>
        </Button>
      </div>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            aria-labelledby={titleId}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border-0 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50"
            onCancel={(event) => {
              event.preventDefault()
              close()
            }}
            onClose={() => setOpen(false)}
            onClick={(event) => {
              if (event.target === event.currentTarget) close()
            }}
          >
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 p-4 sm:px-6">
                <h2 id={titleId} className="text-lg font-semibold">
                  <Trans>Change payment mode</Trans>
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={close}>
                  <X size={20} aria-hidden="true" />
                  <span className="sr-only">
                    <Trans>Close</Trans>
                  </span>
                </Button>
              </div>
              <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-6">
                <fieldset>
                  <legend className="sr-only">
                    <Trans>Payment mode</Trans>
                  </legend>
                  <div className="space-y-3">
                    <label
                      className={`block cursor-pointer rounded-lg border p-4 ${draft === 'none' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200'}`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <input
                          type="radio"
                          name="payment-mode"
                          value="none"
                          disabled={disabled}
                          checked={draft === 'none'}
                          onChange={() => setDraft('none')}
                        />
                        <PaymentModeLabel choice="none" />
                      </span>
                      <p className="ml-6 mt-2 text-sm text-gray-600">
                        <Trans>
                          Attendance is confirmed when the player joins. Payment
                          can be arranged later.
                        </Trans>
                      </p>
                    </label>
                    <label
                      className={`block cursor-pointer rounded-lg border p-4 ${draft === 'manual' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200'}`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <input
                          type="radio"
                          name="payment-mode"
                          value="honor"
                          disabled={disabled}
                          checked={draft === 'manual'}
                          onChange={() => setDraft('manual')}
                        />
                        <PaymentModeLabel choice="manual" />
                      </span>
                      <p className="ml-6 mt-2 text-sm text-gray-600">
                        <Trans>
                          The player checks “I have paid” after sending payment.
                          This immediately confirms their attendance.
                        </Trans>
                      </p>
                    </label>
                    <label
                      className={`block rounded-lg border p-4 ${fioConnected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${draft === 'fio' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200'}`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <input
                          type="radio"
                          name="payment-mode"
                          value="fio"
                          disabled={disabled || !fioConnected}
                          checked={draft === 'fio'}
                          onChange={() => setDraft('fio')}
                        />
                        <PaymentModeLabel choice="fio" />
                      </span>
                      <p className="ml-6 mt-2 text-sm text-gray-600">
                        <Trans>
                          Each player gets a personal QR code. Attendance is
                          confirmed only after the bank verifies payment.
                        </Trans>
                      </p>
                    </label>
                  </div>
                </fieldset>
                {fioConnected && draft === 'fio' && (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <Trans>
                      Uses the Fio account saved in your profile. You do not
                      need to enter the token again.
                    </Trans>{' '}
                    <Link
                      to="/user-profile"
                      onClick={close}
                      className="font-medium underline"
                    >
                      <Trans>Manage Fio connection</Trans>
                    </Link>
                  </p>
                )}
                {!fioConnected && (
                  <p className="text-sm text-gray-600">
                    <Trans>
                      Save a read-only Fio API token with your bank account in
                      your profile to enable bank verification.
                    </Trans>{' '}
                    <Link
                      to="/user-profile"
                      onClick={close}
                      className="text-primary-700 underline"
                    >
                      <Trans>Connect Fio in your profile</Trans>
                    </Link>
                  </p>
                )}
                {draft !== 'none' && (
                  <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-900">
                    <Trans>Fixed price per player:</Trans>{' '}
                    <strong>
                      {amountCents ? (amountCents / 100).toFixed(2) : '—'}{' '}
                      {draft === 'fio' ? 'CZK' : currency}
                    </strong>
                    <br />
                    <span className="text-xs">
                      <Trans>
                        Based on total price and ideal player count (or
                        maximum). Payment settings are locked after the first
                        registration.
                      </Trans>
                    </span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 p-4 sm:px-6">
                <Button type="button" variant="outline" onClick={close}>
                  <Trans>Cancel</Trans>
                </Button>
                <Button
                  type="button"
                  disabled={disabled || (draft === 'fio' && !fioConnected)}
                  onClick={() => {
                    onChange(
                      draft === 'fio' ? 'fio' : 'manual',
                      draft !== 'none'
                    )
                    close()
                  }}
                >
                  <Trans>Save</Trans>
                </Button>
              </div>
            </div>
          </dialog>,
          document.body
        )}
    </>
  )
}

function PaymentModeLabel({ choice }: { choice: PaymentChoice }) {
  if (choice === 'fio')
    return (
      <>
        <Landmark size={17} className="shrink-0" aria-hidden="true" />
        <span>
          <Trans>Advance payment verified by Fio banka</Trans>
        </span>
      </>
    )
  if (choice === 'manual')
    return (
      <>
        <HandCoins size={17} className="shrink-0" aria-hidden="true" />
        <span>
          <Trans>Advance payment on trust</Trans>
        </span>
      </>
    )
  return (
    <>
      <Coins size={17} className="shrink-0" aria-hidden="true" />
      <span>
        <Trans>No advance payment</Trans>
      </span>
    </>
  )
}
