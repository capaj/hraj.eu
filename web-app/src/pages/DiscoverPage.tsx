import React, { useState, useMemo, useRef } from 'react'
import { isPast, isFuture } from 'date-fns'
import { useLoaderData, useNavigate } from '@tanstack/react-router'
import { EventCard } from '../components/events/EventCard'
import { EventFilters } from '../components/events/EventFilters'
import { EventMap, EventMapRef } from '../components/map/EventMap'
import { Button } from '../components/ui/Button'
import { Map, List, ArrowUpDown, History, Flame } from 'lucide-react'
import { Event } from '../types'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { joinEvent } from '~/server-functions/joinEvent'
import { authClient } from '../lib/auth-client'
import { i18n } from '~/lib/i18n'

type SortOption = 'date' | 'distance' | 'spots'

export const DiscoverPage: React.FC = () => {
  const { events: initialEvents, venues } = useLoaderData({ from: '/discover' })
  const navigate = useNavigate()
  const session = authClient.useSession()
  const mapRef = useRef<EventMapRef>(null)
  const [selectedSport, setSelectedSport] = useState<string>()
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>()
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [events, setEvents] = useState(initialEvents)
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)

  React.useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // Get user location for distance calculations
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to Prague center for demo
          setUserLocation({ lat: 50.0755, lng: 14.4378 })
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    } else {
      // Default to Prague center
      setUserLocation({ lat: 50.0755, lng: 14.4378 })
    }
  }, [])

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filteredAndSortedEvents = useMemo(() => {
    // First filter events
    let filtered = events.filter((event: Event) => {
      if (selectedSport && event.sport !== selectedSport) return false
      // Note: In a real app, we'd filter by skill level based on event requirements
      return true
    })

    // Then sort events
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // Sort by date, then by start time
          const dateCompare = a.date.getTime() - b.date.getTime()
          if (dateCompare !== 0) return dateCompare
          return a.startTime.localeCompare(b.startTime)

        case 'distance':
          if (!userLocation) return 0
          const venueA = venues.find((v: any) => v.id === a.venueId)
          const venueB = venues.find((v: any) => v.id === b.venueId)
          if (!venueA || !venueB) return 0

          const distanceA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            venueA.lat,
            venueA.lng
          )
          const distanceB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            venueB.lat,
            venueB.lng
          )
          return distanceA - distanceB

        case 'spots':
          const spotsA = a.maxParticipants - a.participants.length
          const spotsB = b.maxParticipants - b.participants.length
          return spotsB - spotsA // More spots first

        default:
          return 0
      }
    })

    return sorted
  }, [events, selectedSport, selectedSkillLevel, sortBy, userLocation])

  const handleEventSelect = (event: Event) => {
    // Scroll to the corresponding event card in the list
    const eventElement = document.getElementById(`event-${event.id}`)
    if (eventElement) {
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add a temporary highlight effect
      eventElement.classList.add(
        'ring-2',
        'ring-primary-500',
        'ring-opacity-50'
      )
      setTimeout(() => {
        eventElement.classList.remove(
          'ring-2',
          'ring-primary-500',
          'ring-opacity-50'
        )
      }, 2000)
    }
  }

  const handleJoinEvent = async (eventId: string) => {
    if (!session.data?.user?.id) {
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    setJoiningEventId(eventId)
    try {
      const response = await joinEvent({ data: { eventId } })

      if (response?.participants) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId
              ? {
                ...event,
                participants: response.participants.confirmed,
                waitlist: response.participants.waitlisted
              }
              : event
          )
        )
      }
    } catch (error) {
      console.error('Failed to join event:', error)
    } finally {
      setJoiningEventId(null)
    }
  }

  const onViewEvent = (eventId: string) => {
    mapRef.current?.zoomToEvent(eventId)
  }

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case 'date':
        return i18n._(msg`Date & Time`)
      case 'distance':
        return i18n._(msg`Distance`)
      case 'spots':
        return i18n._(msg`Available Spots`)
      default:
        return i18n._(msg`Date & Time`)
    }
  }

  const getEventDistance = (event: Event): string => {
    if (!userLocation) return ''
    const venue = venues.find((v: any) => v.id === event.venueId)
    if (!venue) return ''

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      venue.lat,
      venue.lng
    )
    return distance < 1
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              <Trans>Discover Events</Trans>
            </h1>
            <p className="text-white/80 mt-2">
              <Trans>Find and join sports events in your area</Trans>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-white/80">
            <Map size={16} className="text-white" />
            <span>
              <Trans>Click markers to highlight events below</Trans>
            </span>
          </div>
        </div>

        {/* Filters */}
        <EventFilters
          selectedSport={selectedSport}
          selectedSkillLevel={selectedSkillLevel}
          onSportChange={setSelectedSport}
          onSkillLevelChange={setSelectedSkillLevel}
        />

        {/* Results and Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <p className="text-white/80">
            {i18n._(
              msg`{count} event{count, plural, one {} other {s}} found`.id,
              { count: filteredAndSortedEvents.length }
            )}
          </p>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-3">
            <ArrowUpDown size={16} className="text-white/80" />
            <span className="text-sm text-white font-medium">
              <Trans>Sort by:</Trans>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-white focus:border-transparent bg-white/10 text-white backdrop-blur-sm"
            >
              <option value="date" className="text-gray-900">
                <Trans>Date & Time</Trans>
              </option>
              <option value="distance" className="text-gray-900">
                <Trans>Distance</Trans>
              </option>
              <option value="spots" className="text-gray-900">
                <Trans>Available Spots</Trans>
              </option>
            </select>
          </div>
        </div>

        {/* Map View */}
        <div className="mb-8">
          <div
            className="bg-white rounded-xl shadow-sm border border-white/20 overflow-hidden"
            style={{ height: '400px' }}
          >
            <EventMap
              ref={mapRef}
              events={filteredAndSortedEvents}
              venues={venues}
              onEventSelect={handleEventSelect}
              onJoinEvent={handleJoinEvent}
              currentUserId={session.data?.user?.id}
            />
          </div>
        </div>

        {/* List View */}
        {/* List View */}
        <div className="space-y-12">
          {/* Upcoming Events */}
          <div>
            <div className="flex items-center mb-6">
              <Flame size={20} className="text-white mr-2" />
              <h2 className="text-xl font-semibold text-white">
                <Trans>Upcoming Events</Trans>{' '}
                {sortBy !== 'date' &&
                  i18n._(msg`(sorted by {label})`.id, {
                    label: getSortLabel(sortBy)
                  })}
              </h2>
            </div>

            {filteredAndSortedEvents.filter(e => isFuture(e.date)).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedEvents.filter(e => isFuture(e.date)).map((event, index) => {
                  const distance = getEventDistance(event)
                  return (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      className="transition-all duration-300 relative"
                    >
                      {/* Sort indicator */}
                      {sortBy !== 'date' && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="bg-white text-primary-600 text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                            {sortBy === 'distance' && distance
                              ? distance
                              : sortBy === 'spots'
                                ? i18n._(msg`{count} spots`.id, {
                                  count:
                                    event.maxParticipants -
                                    event.participants.length
                                })
                                : `#${index + 1}`}
                          </div>
                        </div>
                      )}
                      <EventCard
                        event={event}
                        venues={venues}
                        onJoin={handleJoinEvent}
                        onView={onViewEvent}
                        isJoining={joiningEventId === event.id}
                        currentUserId={session.data?.user?.id}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/80">
                  <Trans>No upcoming events found.</Trans>
                </p>
              </div>
            )}
          </div>

          {/* Past Events */}
          {filteredAndSortedEvents.some(e => isPast(e.date)) && (
            <div>
              <div className="flex items-center mb-6">
                <History size={20} className="text-white/80 mr-2" />
                <h2 className="text-xl font-semibold text-white/80">
                  <Trans>Past Events</Trans>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedEvents.filter(e => isPast(e.date)).map((event) => {
                  return (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      className="transition-all duration-300 relative"
                    >
                      <EventCard
                        event={event}
                        venues={venues}
                        onJoin={handleJoinEvent}
                        onView={onViewEvent}
                        isJoining={joiningEventId === event.id}
                        currentUserId={session.data?.user?.id}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {filteredAndSortedEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/60 mb-4">
                <List size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                <Trans>No events found</Trans>
              </h3>
              <p className="text-white/80 mb-4">
                <Trans>Try adjusting your filters or create a new event.</Trans>
              </p>
              <Button variant="secondary">
                <Trans>Create Event</Trans>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
