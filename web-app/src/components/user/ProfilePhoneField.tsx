import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { i18n } from '~/lib/i18n'

interface ProfilePhoneFieldProps {
  isEditing: boolean
  phone?: string
  editedPhone?: string
  onChange: (phone: string) => void
}

export function ProfilePhoneField({
  isEditing,
  phone,
  editedPhone,
  onChange
}: ProfilePhoneFieldProps) {
  return (
    <div>
      <label
        htmlFor="profile-phone"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        <Trans>Mobile phone number</Trans>
      </label>
      {isEditing ? (
        <input
          id="profile-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          value={editedPhone ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder={i18n._(msg`e.g. +420 777 123 456`)}
          aria-describedby="profile-phone-visibility"
        />
      ) : (
        <div className="py-2 text-gray-900">
          {phone || i18n._(msg`Not specified`)}
        </div>
      )}
      <p id="profile-phone-visibility" className="mt-1 text-xs text-gray-500">
        <Trans>
          Shown only to the organizer and confirmed attendees of your events.
        </Trans>
      </p>
    </div>
  )
}
