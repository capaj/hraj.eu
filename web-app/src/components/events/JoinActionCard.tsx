import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { CheckCircle, ChevronDown, Loader2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthSession } from '~/lib/auth-client'
import type { EventGuest } from '~/lib/eventGuests'
import { i18n } from '~/lib/i18n'
import { getEventById } from '~/server-functions/getEventById'
import { joinEvent } from '~/server-functions/joinEvent'
import { updatePlusAttendees } from '~/server-functions/updatePlusAttendees'
import { getAvailablePublicSpots, getTotalReservedAwareHeadcount } from '~/utils/participants'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { GuestUserInput } from './GuestUserInput'

const MAX_GUESTS_PER_USER = 2

interface JoinActionCardProps {
  eventId: string
}

type GuestDraft = {
  value: string
  userId?: string
  selectedUserName?: string
}

const guestsToDrafts = (guests: EventGuest[]): GuestDraft[] =>
  guests.map((guest) => ({
    value: guest.userId ? `@${guest.name}` : guest.name,
    ...(guest.userId
      ? { userId: guest.userId, selectedUserName: guest.name }
      : {})
  }))

const draftsToGuests = (drafts: GuestDraft[]): EventGuest[] =>
  drafts.flatMap((draft) => {
    const value = draft.value.trim()
    if (!value) return []

    if (draft.userId && draft.selectedUserName) {
      return [{ name: draft.selectedUserName, userId: draft.userId }]
    }

    return [{ name: value }]
  })

const areGuestsEqual = (a: EventGuest[], b: EventGuest[]) =>
  a.length === b.length &&
  a.every(
    (guest, index) =>
      guest.name === b[index]?.name && guest.userId === b[index]?.userId
  )

export const JoinActionCard = ({ eventId }: JoinActionCardProps) => {
  const navigate = useNavigate()
  const router = useRouter()
  const session = useAuthSession()
  const currentUserId = session.data?.user?.id
  const [isGuestsExpanded, setIsGuestsExpanded] = useState(false)
  const [guestDrafts, setGuestDrafts] = useState<GuestDraft[]>([])
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
  const savedGuests: EventGuest[] =
    currentUserId && event
      ? (event.participantGuests?.[currentUserId] ??
        (event.participantPlusOnes?.[currentUserId] ?? []).map((name) => ({
          name
        })))
      : []
  const isGuestsFormDirty = !areGuestsEqual(
    draftsToGuests(guestDrafts),
    savedGuests
  )

  let joinButtonText = i18n._(msg`Join Waitlist`)
  if (isSpotAvailable) {
    joinButtonText = i18n._(msg`Join Game`)
  }

  useEffect(() => {
    if (!currentUserId || !event) {
      setGuestDrafts([])
      return
    }

    const guests =
      event.participantGuests?.[currentUserId] ??
      (event.participantPlusOnes?.[currentUserId] ?? []).map((name) => ({ name }))
    setGuestDrafts(guestsToDrafts(guests))
  }, [
    currentUserId,
    event?.participantGuests,
    event?.participantPlusOnes,
    event?.participants
  ])

  const refreshEventData = async () => {
    await Promise.all([refetch(), router.invalidate()])
  }

  const sanitizePlusAttendees = () => {
    const trimmed = guestDrafts.map((draft) => draft.value.trim())
    const hasAnyGuest = trimmed.some((name) => Boolean(name))
    const hasEmptyName = trimmed.some(
      (name, index) => hasAnyGuest && guestDrafts[index] !== undefined && !name
    )

    if (hasEmptyName) {
      throw new Error(i18n._(msg`Please enter a name for each guest.`))
    }

    return draftsToGuests(guestDrafts).slice(0, MAX_GUESTS_PER_USER)
  }

  const handlePlusAttendeeChange = (index: number, value: string) => {
    setGuestDrafts((prev) => {
      const updated = prev.slice()
      while (updated.length < index) updated.push({ value: '' })
      updated[index] = { value }
      return updated
    })
  }

  const handleRemovePlusAttendee = (index: number) => {
    setGuestDrafts((prev) => {
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
        setGuestDrafts(
          guestsToDrafts(
            response.participants.guests[currentUserId] || cleanedPlusAttendees
          )
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
        setGuestDrafts(
          guestsToDrafts(
            response.participants.guests[currentUserId] || cleanedPlusAttendees
          )
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
                <GuestUserInput
                  key={index}
                  eventId={event.id}
                  value={guestDrafts[index]?.value ?? ''}
                  selectedUserId={guestDrafts[index]?.userId}
                  placeholder={i18n._(
                    msg`Guest {index, number} name (optional)`.id,
                    { index: index + 1 }
                  )}
                  canRemove={index < guestDrafts.length}
                  onChange={(value) => handlePlusAttendeeChange(index, value)}
                  onSelect={(user) => {
                    setGuestDrafts((current) => {
                      const updated = current.slice()
                      while (updated.length < index) {
                        updated.push({ value: '' })
                      }
                      updated[index] = {
                        value: `@${user.name}`,
                        userId: user.id,
                        selectedUserName: user.name
                      }
                      return updated
                    })
                  }}
                  onRemove={() => handleRemovePlusAttendee(index)}
                />
              ))}

              <p className="text-xs text-gray-500">
                <Trans>
                  Enter any guest name, or start with @ to link a player.
                </Trans>
              </p>

              {isParticipant && isGuestsFormDirty && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingGuests || isJoining}
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

        {isParticipant ? (
          <div
            role="status"
            className="mb-3 flex items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-6 py-3 text-base font-medium text-primary-700"
          >
            <CheckCircle size={20} className="mr-2" aria-hidden="true" />
            <Trans>You are playing</Trans>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full mb-3"
            disabled={isJoining}
            onClick={handleJoinEvent}
          >
            {joinButtonText}
          </Button>
        )}

      </CardContent>
    </Card>
  )
}
