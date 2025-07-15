import React, { useState } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { WeatherWidget } from '../components/weather/WeatherWidget'
import { Event } from '../types'
import { SPORTS } from '../lib/constants'
import { mockUsers, mockVenues } from '../lib/mock-data'
import {
  generateICalEvent,
  downloadICalFile,
  CalendarEvent
} from '../utils/calendar'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Euro,
  FileText,
  User,
  ArrowLeft,
  Share2,
  Heart,
  CalendarPlus,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  CoinsIcon,
  ThumbsUp,
  ThumbsDown,
  UserX,
  Flag,
  MessageSquare
} from 'lucide-react'
import { format, isPast, addHours } from 'date-fns'

import { useParams, useNavigate } from '@tanstack/react-router'
import { mockEvents } from '../lib/mock-data'

interface KarmaFeedback {
  userId: string
  rating: number
  comment?: string
  noShow?: boolean
  badBehavior?: boolean
}

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams({ from: '/events/$eventId' })
  const navigate = useNavigate()
  const event = mockEvents.find((e) => e.id === eventId)
  const [showKarmaModal, setShowKarmaModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [karmaRating, setKarmaRating] = useState(5)
  const [karmaComment, setKarmaComment] = useState('')
  const [reportType, setReportType] = useState<
    'none' | 'no-show' | 'bad-behavior'
  >('none')
  const [isSubmittingKarma, setIsSubmittingKarma] = useState(false)

  if (!event) {
    return <div>Event not found</div>
  }

  const sport = SPORTS.find((s) => s.id === event.sport)
  const organizer = mockUsers.find((u) => u.id === event.organizerId)
  const venue = mockVenues.find((v) => v.id === event.venueId)
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

  if (!event) {
    return <div>Event not found</div>
  }

  // Mock current user ID (in real app, this would come from auth context)
  const currentUserId = '1' // Assuming current user is Alex
  const isParticipant = event.participants.includes(currentUserId)

  const participantUsers = event.participants
    .map((id) => mockUsers.find((u) => u.id === id))
    .filter(Boolean)

  const getEventStatus = () => {
    if (!isMinimumReached) {
      return {
        variant: 'error' as const,
        text: `Need ${
          event.minParticipants - event.participants.length
        } more players to confirm`,
        icon: <AlertTriangle size={16} className="mr-1" />
      }
    } else if (isIdealReached) {
      return {
        variant: 'success' as const,
        text: 'Event confirmed - ideal number reached!',
        icon: <CheckCircle size={16} className="mr-1" />
      }
    } else {
      return {
        variant: 'warning' as const,
        text: `Event confirmed - ${
          event.idealParticipants! - event.participants.length
        } more for ideal`,
        icon: <Target size={16} className="mr-1" />
      }
    }
  }

  const eventStatus = getEventStatus()

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
      formatted: format(deadlineTime, "EEEE, MMMM d 'at' HH:mm")
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
        `Sport: ${sport?.name}`,
        `Participants: ${event.participants.length}/${event.maxParticipants}`,
        ...(event.idealParticipants
          ? [`Ideal: ${event.idealParticipants} players`]
          : []),
        ...(event.price ? [`Price: €${event.price} per person`] : []),
        ...(event.paymentDetails ? [`Payment: ${event.paymentDetails}`] : []),
        ...(event.gameRules ? ['', 'Game Rules:', event.gameRules] : []),
        '',
        'Event created via hraj.eu'
      ].join('\n'),
      location: venue?.address || 'Location TBD',
      startDate,
      endDate,
      ...(organizer?.name && { organizer: organizer.name })
    }

    const icalContent = generateICalEvent(calendarEvent)
    const filename = `${event.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.ics`

    downloadICalFile(icalContent, filename)
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
    alert(
      `Feedback submitted for ${
        mockUsers.find((u) => u.id === selectedUserId)?.name
      }`
    )
  }

  const getKarmaButtonText = (rating: number, reportType: string) => {
    if (reportType === 'no-show') return 'Report No-Show'
    if (reportType === 'bad-behavior') return 'Report Bad Behavior'
    if (rating >= 4) return 'Give Positive Karma'
    if (rating >= 3) return 'Give Neutral Karma'
    return 'Give Negative Karma'
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
            Back to Events
          </Button>

          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{sport?.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-white">{event.title}</h1>
                <p className="text-lg text-white/80 mt-1">
                  Organized by {organizer?.name}
                </p>
                {hasEventEnded && (
                  <Badge variant="default" size="md" className="mt-2">
                    Event Completed
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Heart size={16} className="mr-2" />
                Save
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
                  <Badge
                    variant={eventStatus.variant}
                    size="md"
                    className="flex items-center w-fit"
                  >
                    {eventStatus.icon}
                    {eventStatus.text}
                  </Badge>
                </div>

                {event.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      About this event
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Cancellation Policy */}
                {cancellationDeadline && !isMinimumReached && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={20}
                        className="text-amber-600 mr-3 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-sm">
                        <p className="text-amber-800 font-medium mb-1">
                          Cancellation Policy
                        </p>
                        <p className="text-amber-700">
                          This event will be automatically cancelled if we don't
                          reach the minimum of {event.minParticipants} players
                          by <strong>{cancellationDeadline.formatted}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Calendar Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleAddToCalendar}
                    className="w-full sm:w-auto"
                  >
                    <CalendarPlus size={16} className="mr-2" />
                    Add to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Event Details
                </h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Calendar size={18} className="mr-2 text-primary-600" />
                      Date & Time
                    </h3>
                    <div className="space-y-3 ml-6">
                      <div className="flex items-center text-gray-700">
                        <Calendar size={16} className="mr-2 text-gray-500" />
                        <span>{format(event.date, 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock size={16} className="mr-2 text-gray-500" />
                        <span>
                          {event.startTime} ({event.duration} minutes)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MapPin size={18} className="mr-2 text-primary-600" />
                      Location
                    </h3>
                    <div className="ml-6">
                      <div className="flex items-start text-gray-700">
                        <MapPin
                          size={16}
                          className="mr-2 mt-0.5 text-gray-500 flex-shrink-0"
                        />
                        <span>{venue?.address || 'Location TBD'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Requirements */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center mb-4">
                    <Users size={18} className="mr-2 text-primary-600" />
                    Player Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {event.minParticipants}
                      </div>
                      <div className="text-sm text-gray-600">Minimum</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Required to confirm
                      </div>
                    </div>
                    {event.idealParticipants && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-900">
                          {event.idealParticipants}
                        </div>
                        <div className="text-sm text-blue-600">Ideal</div>
                        <div className="text-xs text-blue-500 mt-1">
                          Perfect game size
                        </div>
                      </div>
                    )}
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {event.maxParticipants}
                      </div>
                      <div className="text-sm text-green-600">Maximum</div>
                      <div className="text-xs text-green-500 mt-1">
                        Full capacity
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
                    Payment Information
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-lg">
                        Price per person:
                      </span>
                      <span className="font-bold text-2xl text-primary-600">
                        €{event.price}
                      </span>
                    </div>
                    {event.paymentDetails && (
                      <div className="text-gray-600">
                        <strong>Payment details:</strong> {event.paymentDetails}
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
                    Game Rules & Guidelines
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
            <WeatherWidget
              date={event.date}
              location={venue?.address || 'Location TBD'}
              sport={event.sport}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Action */}
            {!hasEventEnded && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {event.participants.length}/{event.maxParticipants}
                    </div>
                    <div className="text-sm text-gray-600">
                      Players confirmed
                    </div>
                    {event.idealParticipants && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ideal: {event.idealParticipants} players
                      </div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mb-3"
                    onClick={() => {
                      console.log('Join event:', event.id)
                      // In a real app, this would make an API call to join the event
                      alert(
                        isSpotAvailable
                          ? 'Successfully joined the game!'
                          : 'Added to waitlist!'
                      )
                    }}
                  >
                    {isSpotAvailable ? 'Join Game' : 'Join Waitlist'}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    Minimum {event.minParticipants} players needed to confirm
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User size={18} className="mr-2" />
                    Who's Playing
                  </h3>
                  {hasEventEnded && isParticipant && (
                    <Badge variant="info" size="sm">
                      Rate Players
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {participantUsers.map((user, index) => (
                    <div
                      key={user?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={user?.image}
                          alt={user?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">
                              {user?.name}
                            </div>
                            {event.organizerId === user?.id && (
                              <Badge variant="info" size="sm">
                                Organizer
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user?.karmaPoints} karma
                          </div>
                        </div>
                      </div>

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
                              Rate
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
                        <span className="text-gray-500">Open spot</span>
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
                            Rate Your Fellow Players
                          </p>
                          <p>
                            Help build our community by giving karma to players
                            who showed good sportsmanship, or report issues if
                            needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">
                  Organizer
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={organizer?.image}
                    alt={organizer?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {organizer?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {organizer?.karmaPoints} karma points
                    </div>
                  </div>
                </div>
                {organizer?.bio && (
                  <p className="text-sm text-gray-600 mb-4">{organizer.bio}</p>
                )}
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Karma Feedback Modal */}
      {showKarmaModal && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Rate {mockUsers.find((u) => u.id === selectedUserId)?.name}
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
                  Feedback Type
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
                      Give karma rating
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
                      Report no-show
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
                      Report bad behavior
                    </span>
                  </label>
                </div>
              </div>

              {/* Karma Rating (only show if not reporting) */}
              {reportType === 'none' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Rating
                  </h4>
                  <div className="flex items-center space-x-2 mb-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setKarmaRating(rating)}
                        className={`p-1 rounded transition-colors ${
                          rating <= karmaRating
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
                    {karmaRating === 1 && 'Poor sportsmanship'}
                    {karmaRating === 2 && 'Below average'}
                    {karmaRating === 3 && 'Average player'}
                    {karmaRating === 4 && 'Good sportsmanship'}
                    {karmaRating === 5 && 'Excellent player!'}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {reportType === 'none'
                    ? 'Comment (optional)'
                    : 'Details (required)'}
                </h4>
                <textarea
                  value={karmaComment}
                  onChange={(e) => setKarmaComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={
                    reportType === 'no-show'
                      ? 'Please describe what happened...'
                      : reportType === 'bad-behavior'
                      ? 'Please describe the behavior issue...'
                      : 'Share your experience playing with this person...'
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
                      <p className="font-medium mb-1">Important</p>
                      <p>
                        {reportType === 'no-show'
                          ? 'No-show reports will deduct karma points and may affect future event participation.'
                          : 'Behavior reports are taken seriously and may result in account restrictions.'}
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
                  Cancel
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
                      Submitting...
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
