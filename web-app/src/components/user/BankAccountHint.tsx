import { Trans } from '@lingui/react/macro'

export function BankAccountHint() {
  return (
    <p className="mt-2 text-xs text-gray-500">
      <Trans>Use account/bank code, prefix-account/bank code, or IBAN. A payment QR code will appear on all events you organize.</Trans>
    </p>
  )
}
