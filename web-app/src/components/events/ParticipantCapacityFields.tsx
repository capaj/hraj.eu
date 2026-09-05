import { Trans } from '@lingui/react/macro'
import {
  MIN_EVENT_PLAYERS,
  normalizeEventParticipantLimits,
  type EventParticipantLimits
} from '~/utils/eventParticipantLimits'

interface ParticipantCapacityFieldsProps {
  value: EventParticipantLimits
  onChange: (value: EventParticipantLimits) => void
}

type ParticipantLimitField = keyof EventParticipantLimits

export function ParticipantCapacityFields({
  value,
  onChange
}: ParticipantCapacityFieldsProps) {
  const rangesDisabled = value.maxParticipants === MIN_EVENT_PLAYERS

  const updateParticipantLimit = (
    field: ParticipantLimitField,
    nextValue: number
  ) => {
    onChange(
      normalizeEventParticipantLimits({
        ...value,
        [field]: nextValue
      })
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div>
        <label
          htmlFor="maxParticipants"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          <Trans>Maximum Players *</Trans>
        </label>
        <input
          id="maxParticipants"
          type="number"
          required
          value={value.maxParticipants}
          onChange={(event) =>
            updateParticipantLimit(
              'maxParticipants',
              Number.parseInt(event.currentTarget.value, 10)
            )
          }
          min={MIN_EVENT_PLAYERS}
          step="1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          <Trans>Maximum capacity</Trans>
        </p>
        <p className="mt-2 text-xs text-blue-700">
          <Trans>Any extra players will be put on a waitlist</Trans>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          <Trans>Tip: Increase max players to widen the sliders.</Trans>
        </p>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="minParticipants"
              className="text-sm font-medium text-gray-700"
            >
              <Trans>Minimum Players *</Trans>
            </label>
            <span className="text-lg font-semibold text-gray-900">
              {value.minParticipants}
            </span>
          </div>
          <input
            id="minParticipants"
            type="range"
            value={value.minParticipants}
            min={MIN_EVENT_PLAYERS}
            max={value.maxParticipants}
            step="1"
            disabled={rangesDisabled}
            onChange={(event) =>
              updateParticipantLimit(
                'minParticipants',
                Number.parseInt(event.currentTarget.value, 10)
              )
            }
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{MIN_EVENT_PLAYERS}</span>
            <span>{value.maxParticipants}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            <Trans>Required to confirm event</Trans>
          </p>
          <p className="mt-1 text-xs text-amber-700">
            <Trans>
              If fewer than the minimum number of players join by the
              cancellation deadline, the event will be automatically cancelled
              and all participants will be notified.
            </Trans>
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="idealParticipants"
              className="text-sm font-medium text-gray-700"
            >
              <Trans>Ideal Players *</Trans>
            </label>
            <span className="text-lg font-semibold text-gray-900">
              {value.idealParticipants}
            </span>
          </div>
          <input
            id="idealParticipants"
            type="range"
            value={value.idealParticipants}
            min={value.minParticipants}
            max={value.maxParticipants}
            step="1"
            disabled={rangesDisabled}
            onChange={(event) =>
              updateParticipantLimit(
                'idealParticipants',
                Number.parseInt(event.currentTarget.value, 10)
              )
            }
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{value.minParticipants}</span>
            <span>{value.maxParticipants}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            <Trans>Perfect number for the best game</Trans>
          </p>
        </div>
      </div>
    </div>
  )
}
