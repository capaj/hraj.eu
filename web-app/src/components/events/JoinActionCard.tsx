import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronDown, Loader2, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth-client'
import { i18n } from '~/lib/i18n'
import { getEventById } from '~/server-functions/getEventById'
import { joinEvent } from '~/server-functions/joinEvent'
import { updatePlusAttendees } from '~/server-functions/updatePlusAttendees'
import { getAvailablePublicSpots, getTotalReservedAwareHeadcount } from '~/utils/participants'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'

const MAX_GUESTS_PER_USER = 2

interface JoinActionCardProps {
  eventId: string
}

const normalizePlusAttendees = (attendees: string[]) =>
  attendees
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, MAX_GUESTS_PER_USER)

const arePlusAttendeesEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((name, index) => name === b[index])

export const JoinActionCard = ({ eventId }: JoinActionCardProps) => {
  const navigate = useNavigate()
  const router = useRouter()
  const session = authClient.useSession()
  const currentUserId = session.data?.user?.id
  const [isGuestsExpanded, setIsGuestsExpanded] = useState(false)
  const [plusAttendees, setPlusAttendees] = useState<string[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [isUpdatingGuests, setIsUpdatingGuests] = useState(false)

  const {
    data: event,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['join-action-event', eventId],
    queryFn: () => getEventById({ data: eventId })
  })

  const isParticipant = currentUserId
    ? event?.participants.includes(currentUserId) ?? false
    : false
  const reservedAwareHeadcount = event ? getTotalReservedAwareHeadcount(event) : 0
  const reservedParticipants = event?.reservedParticipants ?? 0
  const availablePublicSpots = event ? getAvailablePublicSpots(event) : 0
  const isSpotAvailable = availablePublicSpots > 0
  const isMinimumReached = event
    ? reservedAwareHeadcount >= event.minParticipants
    : false
  const savedPlusAttendees =
    currentUserId && event ? (event.participantPlusOnes?.[currentUserId] ?? []) : []
  const isGuestsFormDirty = !arePlusAttendeesEqual(
    normalizePlusAttendees(plusAttendees),
    normalizePlusAttendees(savedPlusAttendees)
  )

  let joinButtonText = i18n._(msg`Join Waitlist`)
  if (isParticipant) {
    joinButtonText = i18n._(msg`You are playing`)
  } else if (isSpotAvailable) {
    joinButtonText = i18n._(msg`Join Game`)
  }

  useEffect(() => {
    if (!currentUserId || !event) {
      setPlusAttendees([])
      return
    }

    setPlusAttendees(event.participantPlusOnes?.[currentUserId] || [])
  }, [currentUserId, event?.participantPlusOnes, event?.participants])

  const refreshEventData = async () => {
    await Promise.all([refetch(), router.invalidate()])
  }

  const sanitizePlusAttendees = () => {
    const trimmed = plusAttendees.map((name) => name.trim())
    const hasAnyGuest = trimmed.some(Boolean)
    const hasEmptyName = trimmed.some(
      (name, index) => hasAnyGuest && plusAttendees[index] !== undefined && !name
    )

    if (hasEmptyName) {
      throw new Error(i18n._(msg`Please enter a name for each guest.`))
    }

    return trimmed.filter(Boolean).slice(0, MAX_GUESTS_PER_USER)
  }

  const handlePlusAttendeeChange = (index: number, value: string) => {
    setPlusAttendees((prev) => {
      const updated = prev.slice()
      updated[index] = value
      return updated
    })
  }

  const handleRemovePlusAttendee = (index: number) => {
    setPlusAttendees((prev) => {
      if (index < 0 || index >= prev.length) return prev
      const updated = prev.slice()
      updated.splice(index, 1)
      return updated
    })
  }

  const handleJoinEvent = async () => {
    if (!event) return

    if (!currentUserId) {
      toast.error(i18n._(msg`Please sign in to join this event.`))
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    try {
      setIsJoining(true)
      const cleanedPlusAttendees = sanitizePlusAttendees()
      const response = await joinEvent({
        data: { eventId: event.id, plusAttendees: cleanedPlusAttendees }
      })

      if (response?.participants) {
        setPlusAttendees(
          response.participants.plusAttendees[currentUserId] ||
          cleanedPlusAttendees
        )
        await refreshEventData()
      }

      if (response?.status === 'waitlisted') {
        toast.info(
          i18n._(
            msg`This event is full right now, so you were added to the waitlist.`
          )
        )
      } else if (response?.status === 'confirmed') {
        toast.success(i18n._(msg`You have successfully joined this game.`))
      } else {
        toast.info(i18n._(msg`Your request was received.`))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to join the event. Please try again.`)
      toast.error(message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleSavePlusAttendees = async () => {
    if (!event || !currentUserId) return

    try {
      setIsUpdatingGuests(true)
      const cleanedPlusAttendees = sanitizePlusAttendees()
      const response = await updatePlusAttendees({
        data: { eventId: event.id, plusAttendees: cleanedPlusAttendees }
      })

      if (response?.participants) {
        setPlusAttendees(
          response.participants.plusAttendees[currentUserId] ||
          cleanedPlusAttendees
        )
        await refreshEventData()
        toast.success(i18n._(msg`Guest list updated.`))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to update guests. Please try again.`)
      toast.error(message)
    } finally {
      setIsUpdatingGuests(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 size={24} className="animate-spin text-primary-600" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !event) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center space-x-1 mb-3">
            <span
              className={`text-4xl font-extrabold ${isMinimumReached
                ? 'text-primary-600'
                : 'text-orange-500'
                }`}
            >
              {reservedAwareHeadcount}
            </span>
            <span className="text-xl text-gray-400 font-medium">
              / {event.maxParticipants}
            </span>
            <div className="text-sm text-gray-600 font-medium">
              <Trans>Players confirmed</Trans>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${isMinimumReached ? 'bg-primary-600' : 'bg-orange-500'
                }`}
              style={{
                width: `${Math.min(
                  100,
                  (reservedAwareHeadcount / event.maxParticipants) * 100
                )}%`
              }}
            />
          </div>


          {reservedParticipants > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {i18n._(msg`+{count} participants reserved`.id, {
                count: reservedParticipants
              })}
            </div>
          )}
          {event.idealParticipants && (
            <div className="text-xs text-gray-500 mt-1">
              {i18n._(msg`Ideal: {count} players`.id, {
                count: event.idealParticipants
              })}
            </div>
          )}
        </div>

        <div className="mb-4">
          <button
            type="button"
            className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
            aria-expanded={isGuestsExpanded}
            aria-controls="event-guests-collapse"
            onClick={() => setIsGuestsExpanded((expanded) => !expanded)}
          >
            <div className="text-sm font-medium text-gray-700 flex items-center">
              <Users size={16} className="mr-2 text-primary-600" />
              <Trans>Bringing guests?</Trans>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {i18n._(msg`Up to {count} names`.id, {
                  count: MAX_GUESTS_PER_USER
                })}
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-500 transition-transform duration-200 ${isGuestsExpanded ? 'rotate-180' : ''
                  }`}
              />
            </div>
          </button>

          {isGuestsExpanded && (
            <div id="event-guests-collapse" className="space-y-2 mt-3">
              {Array.from(
                { length: MAX_GUESTS_PER_USER },
                (_, index) => index
              ).map((index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={plusAttendees[index] || ''}
                    onChange={(e) =>
                      handlePlusAttendeeChange(index, e.target.value)
                    }
                    placeholder={i18n._(
                      msg`Guest {index, number} name (optional)`.id,
                      { index: index + 1 }
                    )}
                    className="w-full rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={index >= plusAttendees.length}
                    onClick={() => handleRemovePlusAttendee(index)}
                    aria-label={i18n._(msg`Remove`)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {isParticipant && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingGuests || isJoining || !isGuestsFormDirty}
                    onClick={handleSavePlusAttendees}
                  >
                    {isUpdatingGuests ? (
                      <Trans>Saving...</Trans>
                    ) : (
                      <Trans>Save guests</Trans>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full mb-3"
          disabled={isJoining || isParticipant}
          onClick={handleJoinEvent}
        >
          {joinButtonText}
        </Button>

      </CardContent>
    </Card>
  )
}
