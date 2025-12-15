import React, { useState, useEffect } from 'react'
import { Link, useLoaderData, useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EventCard } from '../components/events/EventCard'
import { Plus, MapPin, Users, Trophy, Search } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { joinEvent } from '~/server-functions/joinEvent'
import { authClient } from '../lib/auth-client'
import { i18n } from '~/lib/i18n'

export const Home: React.FC = () => {
  const { upcomingEvents: initialUpcomingEvents, stats } = useLoaderData({ from: '/' })
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [userLocation, setUserLocation] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState(initialUpcomingEvents)
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)

  useEffect(() => {
    setUpcomingEvents(initialUpcomingEvents.filter(e => e.status !== 'cancelled'))
  }, [initialUpcomingEvents])

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserLocation(i18n._(msg`your area`))
      setIsLoadingLocation(false)
      return
    }

    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // In a real app, you'd use a reverse geocoding service
          // For demo purposes, we'll simulate getting the city name
          const { latitude, longitude } = position.coords

          // Dynamically import offline geocoding to avoid SSR issues
          const { getNearestCity } = await import('offline-geocode-city')
          const nearestCity = getNearestCity(latitude, longitude)
          const city = nearestCity ? nearestCity.cityName : i18n._(msg`your area`)

          setUserLocation(city)
        } catch (error) {
          console.error('Error getting location name:', error)
          setUserLocation(i18n._(msg`your area`))
        } finally {
          setIsLoadingLocation(false)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        setUserLocation(i18n._(msg`your area`))
        setIsLoadingLocation(false)
      },
      {
        timeout: 30000,
        enableHighAccuracy: false,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [])

  const handleJoinEvent = async (eventId: string) => {
    if (!session.data?.user?.id) {
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    setJoiningEventId(eventId)
    try {
      const response = await joinEvent({ data: { eventId } })

      if (response?.participants) {
        setUpcomingEvents((prevEvents) =>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600">
      {/* Popular Events in Your Area */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">
                {userLocation ? (
                  <Trans>Popular Events in {userLocation}</Trans>
                ) : (
                  <Trans>Popular Events</Trans>
                )}
              </h2>
              {isLoadingLocation ? (
                <div className="flex items-center mt-2 text-white/80">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">
                    <Trans>Finding events near you...</Trans>
                  </span>
                </div>
              ) : (
                <p className="text-white/80 mt-2 flex items-center">
                  {upcomingEvents.length > 0 && (
                    <span className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      <Trans>Showing events near your location</Trans>
                    </span>
                  )}
                </p>
              )}
            </div>
            <Link to="/discover">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Trans>View All Events</Trans>
              </Button>
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Plus size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                <Trans>No Events Yet in Your Area</Trans>
              </h3>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                <Trans>
                  Be the first to bring your community together! Create an event
                  and start building connections through sport.
                </Trans>
              </p>
              <Link to="/create">
                <Button size="lg" variant="secondary" className="text-lg">
                  <Plus size={20} className="mr-2" />
                  <Trans>Create new Event</Trans>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={handleJoinEvent}
                  isJoining={joiningEventId === event.id}
                  currentUserId={session.data?.user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {stats.eventsCreated.toLocaleString()}
              </div>
              <div className="text-white/80">
                <Trans>Events Created</Trans>
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-white/80">
                <Trans>Active Players</Trans>
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {stats.countries}
              </div>
              <div className="text-white/80">
                <Trans>Countries</Trans>
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {stats.successRate}%
              </div>
              <div className="text-white/80">
                <Trans>Success Rate</Trans>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              <Trans>Let's Play Together</Trans>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto animate-slide-up">
              <Trans>
                Join the largest community of sports enthusiasts across Europe.
                Organize games, discover events, and make new friends through
                sport.
              </Trans>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-gentle">
              <Link to="/create">
                <Button size="lg" variant="secondary" className="text-lg">
                  <Plus size={20} className="mr-2" />
                  <Trans>Create Event</Trans>
                </Button>
              </Link>
              <Link to="/discover">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Search size={20} className="mr-2" />
                  <Trans>Discover Games</Trans>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Trans>Find Local Games</Trans>
                </h3>
                <p className="text-gray-600">
                  <Trans>
                    Discover sports events near you with advanced filtering by
                    sport, skill level, and location.
                  </Trans>
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-secondary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Trans>Build Community</Trans>
                </h3>
                <p className="text-gray-600">
                  <Trans>
                    Connect with like-minded players, earn karma points, and climb
                    the leaderboards.
                  </Trans>
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={24} className="text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Trans>Easy Organization</Trans>
                </h3>
                <p className="text-gray-600">
                  <Trans>
                    Create events with payment integration, team balancing, and
                    automated notifications.
                  </Trans>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
