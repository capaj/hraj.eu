import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { WeatherWidget } from '../components/weather/WeatherWidget'
import { SPORTS, FACILITIES } from '../lib/constants'
import { UserAvatar } from '../components/user/UserAvatar'
import {
  generateICalEvent,
  downloadICalFile,
  CalendarEvent
} from '../utils/calendar'
import { VenueMapPreview } from '../components/venues/VenueMapPreview'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  User as UserIcon,
  ArrowLeft,
  Share2,
  Heart,
  CalendarPlus,
  Target,
  House,
  AlertTriangle,
  CheckCircle,
  Star,
  CoinsIcon,
  UserX,
  Flag,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
  Facebook,
  Twitter,
  MessageCircle,
  Send,
  Edit,
  ChevronDown
} from 'lucide-react'
import { format, isPast, addHours } from 'date-fns'
import { enUS, cs } from 'date-fns/locale'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { i18n } from '~/lib/i18n'
import { toast } from 'sonner'
import {
  FacebookShare,
  TwitterShare,
  WhatsappShare,
  TelegramShare
} from 'react-share-kit'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu'

import { useLoaderData, useNavigate } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { joinEvent } from '~/server-functions/joinEvent'
import { leaveEvent } from '~/server-functions/leaveEvent'
import { getUserById } from '~/server-functions/getUserById'
import { User } from '../types'

interface KarmaFeedback {
  userId: string
  rating: number
  comment?: string
  noShow?: boolean
  badBehavior?: boolean
}



export const EventDetailsPage: React.FC = () => {
  const {
    event: initialEvent,
    venue,
    organizer,
    participants: participantUsers
  } = useLoaderData({ from: '/events/$eventId' })
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [event, setEvent] = useState(initialEvent)
  const [showKarmaModal, setShowKarmaModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [karmaRating, setKarmaRating] = useState(5)
  const [karmaComment, setKarmaComment] = useState('')
  const [reportType, setReportType] = useState<
    'none' | 'no-show' | 'bad-behavior'
  >('none')
  const [isSubmittingKarma, setIsSubmittingKarma] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [participants, setParticipants] = useState<User[]>(
    participantUsers || []
  )
  const [shareUrl, setShareUrl] = useState('')
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }
  }, [])

  useEffect(() => {
    setEvent(initialEvent)
  }, [initialEvent])

  useEffect(() => {
    setParticipants(participantUsers || [])
  }, [participantUsers])

  if (!event) {
    return (
      <div>
        <Trans>Event not found</Trans>
      </div>
    )
  }

  const sport = SPORTS.find((s) => s.id === event.sport)
  const isSpotAvailable = event.participants.length < event.maxParticipants
  const spotsLeft = event.maxParticipants - event.participants.length
  const isMinimumReached = event.participants.length >= event.minParticipants
  const isIdealReached =
    event.idealParticipants &&
    event.participants.length >= event.idealParticipants

  // Check if event has ended (event date + duration has passed)
  const eventDateTime = new Date(event.date)
  const [hours = 0, minutes = 0] = event.startTime.split(':').map(Number)
  eventDateTime.setHours(hours, minutes, 0, 0)
  const eventEndTime = addHours(eventDateTime, Math.ceil(event.duration / 60))
  const hasEventEnded = isPast(eventEndTime)

  // Get current user ID from session
  const currentUserId = session.data?.user?.id
  const isParticipant = currentUserId
    ? event.participants.includes(currentUserId)
    : false

  const participantsMap = new Map(participants.map((user) => [user.id, user]))

  const participantUsersList = event.participants
    .map((id) => participantsMap.get(id))
    .filter((user): user is NonNullable<typeof user> => user !== undefined)

  const shouldShowWeather = venue?.type !== 'indoor'

  const getEventStatus = () => {
    if (!isMinimumReached) {
      return {
        variant: 'error' as const,
        text: i18n._(msg`Need {count} more players to confirm`.id, {
          count: event.minParticipants - event.participants.length
        }),
        icon: <AlertTriangle size={16} className="mr-1" />
      }
    } else if (isIdealReached) {
      return {
        variant: 'success' as const,
        text: i18n._(msg`Event confirmed - ideal number reached!`),
        icon: <CheckCircle size={16} className="mr-1" />
      }
    } else {
      return {
        variant: 'warning' as const,
        text: i18n._(msg`Event confirmed - {count} more for ideal`.id, {
          count: event.idealParticipants! - event.participants.length
        }),
        icon: <Target size={16} className="mr-1" />
      }
    }
  }

  const eventStatus = getEventStatus()
  const dateLocale = i18n.locale === 'cs' ? cs : enUS

  const getCancellationDeadline = () => {
    if (!event.cancellationDeadlineHours) return null

    const eventDateTime = new Date(event.date)
    const [hours = 0, minutes = 0] = event.startTime.split(':').map(Number)
    eventDateTime.setHours(hours, minutes, 0, 0)

    const deadlineTime = new Date(
      eventDateTime.getTime() - event.cancellationDeadlineHours * 60 * 60 * 1000
    )

    return {
      time: deadlineTime,
      formatted: format(
        deadlineTime,
        i18n.locale === 'cs' ? "EEEE, d. MMMM 'v' HH:mm" : "EEEE, MMMM d 'at' HH:mm",
        { locale: dateLocale }
      )
    }
  }

  const cancellationDeadline = getCancellationDeadline()

  const handleAddToCalendar = () => {
    // Parse the start time and create proper Date objects
    const [hours = 0, minutes = 0] = event.startTime.split(':').map(Number)
    const startDate = new Date(event.date)
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + event.duration)

    const calendarEvent: CalendarEvent = {
      title: event.title,
      description: [
        event.description,
        '',
        i18n._(msg`Sport: {sportName}`.id, { sportName: sport?.name ?? '' }),
        i18n._(msg`Participants: {current}/{max}`.id, {
          current: event.participants.length,
          max: event.maxParticipants
        }),
        ...(event.idealParticipants
          ? [
            i18n._(msg`Ideal: {count} players`.id, {
              count: event.idealParticipants
            })
          ]
          : []),
        ...(event.price
          ? [
            i18n._(msg`Price: €{price} per person`.id, {
              price: event.price
            })
          ]
          : []),
        ...(event.paymentDetails
          ? [
            i18n._(msg`Payment: {paymentDetails}`.id, {
              paymentDetails: event.paymentDetails
            })
          ]
          : []),
        ...(event.gameRules
          ? ['', i18n._(msg`Game Rules:`), event.gameRules]
          : []),
        '',
        i18n._(msg`Event created via hraj.eu`)
      ].join('\n'),
      location: venue?.address || i18n._(msg`Location TBD`),
      startDate,
      endDate
      // TODO: Add organizer name when fetching user data
    }

    const icalContent = generateICalEvent(calendarEvent)
    const filename = `${event.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.ics`

    downloadICalFile(icalContent, filename)
  }

  const handleJoinEvent = async () => {
    if (!event) {
      return
    }

    if (!currentUserId) {
      toast.error(i18n._(msg`Please sign in to join this event.`))
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    try {
      setIsJoining(true)
      const response = await joinEvent({ data: { eventId: event.id } })

      if (response?.participants) {
        setEvent((prev) => ({
          ...prev,
          participants: response.participants.confirmed,
          waitlist: response.participants.waitlisted
        }))

        const existingIds = new Set(participants.map((u) => u.id))
        const newParticipantIds = response.participants.confirmed.filter(
          (id) => !existingIds.has(id)
        )

        if (newParticipantIds.length > 0) {
          const newParticipants = await Promise.all(
            newParticipantIds.map((id) => getUserById({ data: id }))
          )
          setParticipants((prev) => [...prev, ...newParticipants])
        }
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

  const handleLeaveEvent = async () => {
    if (!event || !currentUserId) return

    try {
      setIsJoining(true) // Reusing isJoining state for loading UI
      const response = await leaveEvent({ data: { eventId: event.id } })

      if (response?.participants) {
        setEvent((prev) => ({
          ...prev,
          participants: response.participants.confirmed,
          waitlist: response.participants.waitlisted
        }))

        // Removed user is naturally filtered out from participants list render 
        // because event.participants (ids) is updated.
        // But we might want to keep the user object in `participants` state 
        // so we don't have to refetch if they rejoin? 
        // Actually, we are just maintaining a list of User objects.
        // No need to remove from `participants` state array, 
        // just updating `event.participants` (list of IDs) is enough to trigger re-render
        // and filter the list correctly in `participantUsersList`.

        toast.info(i18n._(msg`You have left the event.`))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to leave the event. Please try again.`)
      toast.error(message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleOpenKarmaModal = (userId: string) => {
    setSelectedUserId(userId)
    setKarmaRating(5)
    setKarmaComment('')
    setReportType('none')
    setShowKarmaModal(true)
  }

  const handleCloseKarmaModal = () => {
    setShowKarmaModal(false)
    setSelectedUserId(null)
    setKarmaRating(5)
    setKarmaComment('')
    setReportType('none')
  }

  const handleSubmitKarma = async () => {
    if (!selectedUserId) return

    setIsSubmittingKarma(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const feedback: KarmaFeedback = {
      userId: selectedUserId,
      rating: reportType === 'none' ? karmaRating : 1,
      comment: karmaComment,
      noShow: reportType === 'no-show',
      badBehavior: reportType === 'bad-behavior'
    }

    console.log('Karma feedback submitted:', feedback)

    // In a real app, this would make an API call to submit the feedback
    // and update the user's karma points accordingly

    setIsSubmittingKarma(false)
    handleCloseKarmaModal()

    // Show success message
    alert(i18n._(msg`Feedback submitted successfully`))
  }

  const getKarmaButtonText = (rating: number, reportType: string) => {
    if (reportType === 'no-show') return i18n._(msg`Report No-Show`)
    if (reportType === 'bad-behavior') return i18n._(msg`Report Bad Behavior`)
    if (rating >= 4) return i18n._(msg`Give Positive Karma`)
    if (rating >= 3) return i18n._(msg`Give Neutral Karma`)
    return i18n._(msg`Give Negative Karma`)
  }

  const getKarmaButtonVariant = (rating: number, reportType: string) => {
    if (reportType !== 'none') return 'secondary' as const
    if (rating >= 4) return 'primary' as const
    if (rating >= 3) return 'outline' as const
    return 'secondary' as const
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/discover' })}
            className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft size={16} className="mr-2" />
            <Trans>Back to Events</Trans>
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{sport?.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-white">{event.title}</h1>
                <p className="text-lg text-white/80 mt-1">
                  <Trans>Organized event</Trans>
                </p>
                {hasEventEnded && (
                  <Badge variant="default" size="md" className="mt-2">
                    <Trans>Event Completed</Trans>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentUserId === event.organizerId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => navigate({ to: '/edit-event/$eventId', params: { eventId: event.id } })}
                >
                  <Edit size={16} className="mr-2" />
                  <Trans>Edit Event</Trans>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={event.status === 'cancelled'}>
                  <Button
                    variant="outline"
                    disabled={event.status === 'cancelled'}
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Share2 size={16} className="mr-2" />
                    <Trans>Share</Trans>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <FacebookShare url={shareUrl} className="w-full flex items-center cursor-pointer">
                      <Facebook size={20} className="mr-2" />
                      <span>Facebook</span>
                    </FacebookShare>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <TwitterShare url={shareUrl} title={event.title} className="w-full flex items-center cursor-pointer">
                      <Twitter size={20} className="mr-2" />
                      <span>Twitter</span>
                    </TwitterShare>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <WhatsappShare url={shareUrl} title={event.title} className="w-full flex items-center cursor-pointer">
                      <MessageCircle size={20} className="mr-2" />
                      <span>WhatsApp</span>
                    </WhatsappShare>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <TelegramShare url={shareUrl} title={event.title} className="w-full flex items-center cursor-pointer">
                      <Send size={20} className="mr-2" />
                      <span>Telegram</span>
                    </TelegramShare>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Heart size={16} className="mr-2" />
                <Trans>Save</Trans>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Status and Description */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  {event.status === 'cancelled' ? (
                    <Badge variant="destructive" size="md" className="flex items-center w-fit">
                      <AlertTriangle size={16} className="mr-1" />
                      <Trans>Event Cancelled</Trans>
                    </Badge>
                  ) : (
                    <Badge
                      variant={eventStatus.variant}
                      size="md"
                      className="flex items-center w-fit"
                    >
                      {eventStatus.icon}
                      {eventStatus.text}
                    </Badge>
                  )}
                </div>

                {event.status === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={20}
                        className="text-red-600 mr-3 mt-0.5 flex-shrink-0"
                      />

                      <div className="text-sm">
                        <p className="text-red-800 font-medium mb-1">
                          <Trans>This event has been cancelled</Trans>
                        </p>
                        <p className="text-red-700">
                          <Trans>The organizer has cancelled this event.</Trans>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      <Trans>About this event</Trans>
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Cancellation Policy */}
                {cancellationDeadline && !isMinimumReached && event.status !== 'cancelled' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={20}
                        className="text-amber-600 mr-3 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-sm">
                        <p className="text-amber-800 font-medium mb-1">
                          <Trans>Cancellation Policy</Trans>
                        </p>
                        <p className="text-amber-700">
                          <Trans>
                            This event will be automatically cancelled if we don't
                            reach the minimum of {event.minParticipants} players
                            by <strong>{cancellationDeadline.formatted}</strong>.
                          </Trans>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Calendar Button */}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  <Trans>Event Details</Trans>
                </h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center whitespace-nowrap">
                        <Calendar size={18} className="mr-2 text-primary-600" />
                        <Trans>Date & Time</Trans>
                      </h3>

                    </div>
                    <div className="space-y-3 ml-6">
                      <div className="flex items-center text-gray-700">
                        <Calendar size={16} className="mr-2 text-gray-500" />
                        <span>
                          {format(event.date, 'PPPP', { locale: dateLocale })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock size={16} className="mr-2 text-gray-500" />
                        <span>
                          {i18n._(msg`{time} ({duration} minutes)`.id, {
                            time: event.startTime,
                            duration: event.duration
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToCalendar}
                      className="h-8 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <CalendarPlus size={14} className="mr-1.5" />
                      <Trans>Add to Calendar</Trans>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MapPin size={18} className="mr-2 text-primary-600" />
                      <Trans>Location</Trans>
                    </h3>
                    <div className="ml-6">
                      <div className="flex items-start text-gray-700">
                        <MapPin
                          size={16}
                          className="mr-2 mt-0.5 text-gray-500 flex-shrink-0"
                        />
                        <span>
                          {venue?.address || i18n._(msg`Location TBD`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Requirements */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center mb-4">
                    <Users size={18} className="mr-2 text-primary-600" />
                    <Trans>Player Requirements</Trans>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">
                        {event.minParticipants}
                      </div>
                      <div className="text-xs text-gray-600">
                        <Trans>Minimum</Trans>
                      </div>
                      <div className="hidden sm:block text-xs text-gray-500 mt-1">
                        <Trans>Required to confirm</Trans>
                      </div>
                    </div>
                    {event.idealParticipants && (
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-900">
                          {event.idealParticipants}
                        </div>
                        <div className="text-xs text-blue-600">
                          <Trans>Ideal</Trans>
                        </div>
                        <div className="hidden sm:block text-xs text-blue-500 mt-1">
                          <Trans>Perfect game size</Trans>
                        </div>
                      </div>
                    )}
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-900">
                        {event.maxParticipants}
                      </div>
                      <div className="text-xs text-green-600">
                        <Trans>Maximum</Trans>
                      </div>
                      <div className="hidden sm:block text-xs text-green-500 mt-1">
                        <Trans>Full capacity</Trans>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center mb-4">
                    <UserIcon size={18} className="mr-2 text-primary-600" />
                    <Trans>Organizer</Trans>
                  </h3>
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      user={organizer || {}}
                      className="w-12 h-12"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {organizer?.name || i18n._(msg`Event Organizer`)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <Trans>Karma points: {organizer?.karmaPoints}</Trans>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            {event.price && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CoinsIcon size={20} className="mr-2 text-primary-600" />
                    <Trans>Payment Information</Trans>
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-lg">
                        <Trans>Price total:</Trans>
                      </span>
                      <span className="font-bold text-2xl text-primary-600">
                        {event.price} {event.currency ?? 'CZK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-lg">
                        <Trans>Price per person({event.idealParticipants ?? event.minParticipants} people):</Trans>
                      </span>
                      <span className="font-bold text-2xl text-primary-600">
                        {event.price / (event.idealParticipants ?? event.minParticipants)}{' '}
                        {event.currency ?? 'CZK'}
                      </span>
                    </div>
                    {event.paymentDetails && (
                      <div className="text-gray-600">
                        <strong>
                          <Trans>Payment details:</Trans>
                        </strong>{' '}
                        {event.paymentDetails}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Rules */}
            {event.gameRules && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText size={20} className="mr-2 text-primary-600" />
                    <Trans>Game Rules & Guidelines</Trans>
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {event.gameRules}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Widget */}
            {shouldShowWeather && (
              <WeatherWidget
                date={event.date}
                location={venue?.address || i18n._(msg`Location TBD`)}
                sport={event.sport}
              />
            )}


          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Action */}
            {!hasEventEnded && event.status !== 'cancelled' && (
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
                        {event.participants.length}
                      </span>
                      <span className="text-xl text-gray-400 font-medium">
                        / {event.maxParticipants}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${isMinimumReached ? 'bg-primary-600' : 'bg-orange-500'
                          }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (event.participants.length / event.maxParticipants) *
                            100
                          )}%`
                        }}
                      />
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                      <Trans>Players confirmed</Trans>
                    </div>
                    {event.idealParticipants && (
                      <div className="text-xs text-gray-500 mt-1">
                        {i18n._(msg`Ideal: {count} players`.id, {
                          count: event.idealParticipants
                        })}
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
                    {isParticipant
                      ? i18n._(msg`You are playing`)
                      : isSpotAvailable
                        ? i18n._(msg`Join Game`)
                        : i18n._(msg`Join Waitlist`)}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    {i18n._(msg`Minimum {count} players needed to confirm`.id, {
                      count: event.minParticipants
                    })}
                  </div>
                  {/* Join message removed, now using toast */}
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader
                className="cursor-pointer lg:cursor-default"
                onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <UserIcon size={18} className="mr-2" />
                    <Trans>Who's Playing</Trans>
                    <ChevronDown
                      size={20}
                      className={`ml-2 lg:hidden transition-transform duration-200 ${isParticipantsExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  </h3>
                  {hasEventEnded && isParticipant && (
                    <Badge variant="info" size="sm">
                      <Trans>Rate Players</Trans>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className={`p-6 ${!isParticipantsExpanded ? 'hidden lg:block' : ''
                  }`}
              >
                <div className="space-y-3">
                  {participantUsersList.map((user) => (
                    <div
                      key={user?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          user={user || {}}
                          className="w-10 h-10"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">
                              {user?.name}
                            </div>
                            {event.organizerId === user?.id && (
                              <Badge variant="info" size="sm">
                                <Trans>Organizer</Trans>
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {i18n._(msg`{karmaPoints} karma`.id, {
                              karmaPoints: user?.karmaPoints ?? 0
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Leave button for current user */}
                      {!hasEventEnded &&
                        currentUserId === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLeaveEvent}
                            disabled={isJoining}
                          >
                            <UserX size={16} className="mr-1" />
                            <Trans>Leave</Trans>
                          </Button>
                        )}

                      {/* Karma feedback buttons - only show after event ends and for other participants */}
                      {hasEventEnded &&
                        isParticipant &&
                        user?.id !== currentUserId &&
                        user && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenKarmaModal(user.id)}
                              className="flex items-center"
                            >
                              <Star size={14} className="mr-1" />
                              <Trans>Rate</Trans>
                            </Button>
                          </div>
                        )}
                    </div>
                  ))}

                  {/* Empty spots - only show for future events */}
                  {!hasEventEnded &&
                    Array.from({ length: spotsLeft }, (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-200 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users size={16} className="text-gray-400" />
                        </div>
                        <span className="text-gray-500">
                          <Trans>Open spot</Trans>
                        </span>
                      </div>
                    ))}
                </div>

                {/* Post-event feedback notice */}
                {hasEventEnded && isParticipant && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <Star
                          size={16}
                          className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                        />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">
                            <Trans>Rate Your Fellow Players</Trans>
                          </p>
                          <p>
                            <Trans>
                              Help build our community by giving karma to players
                              who showed good sportsmanship, or report issues if
                              needed.
                            </Trans>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Venue Information - Full Width */}
        {venue && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <House size={16} className="mr-2 text-primary-600" />
                <Trans>Venue Information</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {venue.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {[venue.address, venue.city, venue.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <Badge variant="default">
                      {venue.type === 'indoor'
                        ? i18n._(msg`Indoor venue`)
                        : venue.type === 'mixed'
                          ? i18n._(msg`Indoor & outdoor venue`)
                          : i18n._(msg`Outdoor venue`)}
                    </Badge>
                  </div>

                  {venue.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {venue.description}
                    </p>
                  )}

                  {venue.accessInstructions && (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                      <p className="font-medium mb-1">
                        <Trans>Access Instructions</Trans>
                      </p>
                      <p>{venue.accessInstructions}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {venue.contactInfo?.phone ? (
                      <a
                        href={`tel:${venue.contactInfo.phone}`}
                        className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Phone size={16} className="mr-2 text-gray-500" />
                        {venue.contactInfo.phone}
                      </a>
                    ) : (
                      <div
                        className="flex items-center text-gray-400"
                        title={i18n._(msg`No phone number available`)}
                      >
                        <Phone size={16} className="mr-2 text-gray-300" />
                        <span className="italic">
                          <Trans>No phone number</Trans>
                        </span>
                      </div>
                    )}

                    {venue.contactInfo?.email && (
                      <a
                        href={`mailto:${venue.contactInfo.email}`}
                        className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Mail size={16} className="mr-2 text-gray-500" />
                        {venue.contactInfo.email}
                      </a>
                    )}
                    {venue.contactInfo?.website && (
                      <a
                        href={venue.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Globe size={16} className="mr-2 text-gray-500" />
                        <Trans>Visit website</Trans>
                      </a>
                    )}
                    {venue.price ? (
                      <div className="flex items-center text-gray-700">
                        <CoinsIcon size={16} className="mr-2 text-gray-500" />
                        {i18n._(msg`Approx. {price} {currency} / hour`.id, {
                          price: venue.price,
                          currency: venue.currency
                        })}
                      </div>
                    ) : null}
                  </div>

                  {venue.facilities && venue.facilities.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        <Trans>Facilities</Trans>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {venue.facilities.map((facilityId) => {
                          const facility = FACILITIES.find(
                            (f) => f.id === facilityId
                          )
                          return (
                            <span
                              key={facilityId}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center"
                            >
                              {facility?.icon && (
                                <span className="mr-1.5">{facility.icon}</span>
                              )}
                              {facility?.name || facilityId}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Venue Images & Orientation Plan */}
                  {((venue.images && venue.images.length > 0) ||
                    venue.orientationPlan) && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <ImageIcon size={16} className="mr-2 text-primary-600" />
                          <Trans>Photos & Orientation</Trans>
                        </h4>

                        <div className="space-y-6">
                          {/* Orientation Plan */}
                          {venue.orientationPlan && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                <Trans>Orientation Plan</Trans>
                              </p>
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity">
                                <a
                                  href={venue.orientationPlan}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={venue.orientationPlan}
                                    alt={i18n._(msg`{name} Orientation Plan`.id, {
                                      name: venue.name
                                    })}
                                    className="w-full h-auto object-contain max-h-[300px] bg-gray-50"
                                  />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Venue Photos */}
                          {venue.images && venue.images.length > 0 && (
                            <div className="space-y-2">
                              {venue.orientationPlan && (
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                  <Trans>Photos</Trans>
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                {venue.images.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video cursor-pointer hover:opacity-95 transition-opacity"
                                  >
                                    <a
                                      href={img}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={img}
                                        alt={i18n._(msg`{name} photo {index}`.id, {
                                          name: venue.name,
                                          index: idx + 1
                                        })}
                                        className="w-full h-full object-cover"
                                      />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div className="h-full min-h-[300px] rounded-lg overflow-hidden">
                  <VenueMapPreview
                    lat={venue.lat}
                    lng={venue.lng}
                    className="w-full h-full min-h-[300px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Karma Feedback Modal */}
      {showKarmaModal && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <Trans>Rate Participant</Trans>
                </h3>
                <button
                  onClick={handleCloseKarmaModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Report Type Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  <Trans>Feedback Type</Trans>
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="none"
                      checked={reportType === 'none'}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <Trans>Give karma rating</Trans>
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="no-show"
                      checked={reportType === 'no-show'}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <UserX size={14} className="mr-1 text-red-500" />
                      <Trans>Report no-show</Trans>
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="bad-behavior"
                      checked={reportType === 'bad-behavior'}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      <Flag size={14} className="mr-1 text-red-500" />
                      <Trans>Report bad behavior</Trans>
                    </span>
                  </label>
                </div>
              </div>

              {/* Karma Rating (only show if not reporting) */}
              {reportType === 'none' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    <Trans>Rating</Trans>
                  </h4>
                  <div className="flex items-center space-x-2 mb-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setKarmaRating(rating)}
                        className={`p-1 rounded transition-colors ${rating <= karmaRating
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                          }`}
                      >
                        <Star
                          size={24}
                          fill={rating <= karmaRating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {karmaRating === 1 && i18n._(msg`Poor sportsmanship`)}
                    {karmaRating === 2 && i18n._(msg`Below average`)}
                    {karmaRating === 3 && i18n._(msg`Average player`)}
                    {karmaRating === 4 && i18n._(msg`Good sportsmanship`)}
                    {karmaRating === 5 && i18n._(msg`Excellent player!`)}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {reportType === 'none'
                    ? i18n._(msg`Comment (optional)`)
                    : i18n._(msg`Details (required)`)}
                </h4>
                <textarea
                  value={karmaComment}
                  onChange={(e) => setKarmaComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={
                    reportType === 'no-show'
                      ? i18n._(msg`Please describe what happened...`)
                      : reportType === 'bad-behavior'
                        ? i18n._(msg`Please describe the behavior issue...`)
                        : i18n._(
                          msg`Share your experience playing with this person...`
                        )
                  }
                  required={reportType !== 'none'}
                />
              </div>

              {/* Warning for reports */}
              {reportType !== 'none' && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle
                      size={16}
                      className="text-red-600 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">
                        <Trans>Important</Trans>
                      </p>
                      <p>
                        {reportType === 'no-show'
                          ? i18n._(
                            msg`No-show reports will deduct karma points and may affect future event participation.`
                          )
                          : i18n._(
                            msg`Behavior reports are taken seriously and may result in account restrictions.`
                          )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCloseKarmaModal}
                  className="flex-1"
                  disabled={isSubmittingKarma}
                >
                  <Trans>Cancel</Trans>
                </Button>
                <Button
                  variant={getKarmaButtonVariant(karmaRating, reportType)}
                  onClick={handleSubmitKarma}
                  className="flex-1"
                  disabled={
                    isSubmittingKarma ||
                    (reportType !== 'none' && !karmaComment.trim())
                  }
                >
                  {isSubmittingKarma ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <Trans>Submitting...</Trans>
                    </div>
                  ) : (
                    getKarmaButtonText(karmaRating, reportType)
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
