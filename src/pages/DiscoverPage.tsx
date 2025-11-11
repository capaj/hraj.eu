import React, { useState, useMemo, useRef } from 'react'
import { useLoaderData } from '@tanstack/react-router'
import { EventCard } from '../components/events/EventCard'
import { EventFilters } from '../components/events/EventFilters'
import { EventMap, EventMapRef } from '../components/map/EventMap'
import { Button } from '../components/ui/Button'
import { Map, List, ArrowUpDown } from 'lucide-react'
import { Event } from '../types'

type SortOption = 'date' | 'distance' | 'spots'

export const Discover: React.FC = () => {
  const { events, venues } = useLoaderData({ from: '/discover' })
  const mapRef = useRef<EventMapRef>(null)
  const [selectedSport, setSelectedSport] = useState<string>()
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>()
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

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
    setSelectedEvent(event)
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

  const handleJoinEvent = (eventId: string) => {
    console.log('Join event:', eventId)
    // In a real app, this would make an API call to join the event
  }

  const onViewEvent = (eventId: string) => {
    mapRef.current?.zoomToEvent(eventId)
  }

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case 'date':
        return 'Date & Time'
      case 'distance':
        return 'Distance'
      case 'spots':
        return 'Available Spots'
      default:
        return 'Date & Time'
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
            <h1 className="text-3xl font-bold text-white">Discover Events</h1>
            <p className="text-white/80 mt-2">
              Find and join sports events in your area
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-white/80">
            <Map size={16} className="text-white" />
            <span>Click markers to highlight events below</span>
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
            {filteredAndSortedEvents.length} event
            {filteredAndSortedEvents.length !== 1 ? 's' : ''} found
          </p>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-3">
            <ArrowUpDown size={16} className="text-white/80" />
            <span className="text-sm text-white font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-white focus:border-transparent bg-white/10 text-white backdrop-blur-sm"
            >
              <option value="date" className="text-gray-900">
                Date & Time
              </option>
              <option value="distance" className="text-gray-900">
                Distance
              </option>
              <option value="spots" className="text-gray-900">
                Available Spots
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
            />
          </div>
        </div>

        {/* List View */}
        <div>
          <div className="flex items-center mb-6">
            <List size={20} className="text-white mr-2" />
            <h2 className="text-xl font-semibold text-white">
              Event List{' '}
              {sortBy !== 'date' && `(sorted by ${getSortLabel(sortBy)})`}
            </h2>
          </div>

          {filteredAndSortedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedEvents.map((event, index) => {
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
                            ? `${
                                event.maxParticipants -
                                event.participants.length
                              } spots`
                            : `#${index + 1}`}
                        </div>
                      </div>
                    )}
                    <EventCard
                      event={event}
                      venues={venues}
                      onJoin={handleJoinEvent}
                      onView={onViewEvent}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-white/60 mb-4">
                <List size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No events found
              </h3>
              <p className="text-white/80 mb-4">
                Try adjusting your filters or create a new event.
              </p>
              <Button variant="secondary">Create Event</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
