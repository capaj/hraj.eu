import { msg } from '@lingui/core/macro'
import { Phone } from 'lucide-react'
import { i18n } from '~/lib/i18n'

interface AttendeePhoneNumberProps {
  name: string
  phone?: string
}

export function AttendeePhoneNumber({
  name,
  phone
}: AttendeePhoneNumberProps) {
  if (!phone) return null

  return (
    <a
      href={`tel:${phone}`}
      className="mt-1 flex w-fit items-center text-xs text-primary-700 hover:text-primary-800 hover:underline"
      aria-label={i18n._(msg`Call ${name} at ${phone}`)}
    >
      <Phone size={13} className="mr-1" aria-hidden="true" />
      {phone}
    </a>
  )
}
