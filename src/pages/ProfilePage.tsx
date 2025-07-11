import React from 'react'
import { useNavigate, useLoaderData } from '@tanstack/react-router'
import { UserProfile } from '../components/user/UserProfile'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

import { Calendar, MapPin, Users, Clock, Heart, Trophy } from 'lucide-react'
import { format, isPast, isFuture } from 'date-fns'
import { useAuthenticate } from '@daveyplate/better-auth-ui'

export const Profile: React.FC = () => {
  useAuthenticate() // This is needed to make the auth work
  const { user, notifications, events, venues, users } = useLoaderData({
    from: '/profile'
  })
  const navigate = useNavigate()

  // Mock saved events (in a real app, this would come from user's saved events)
  const savedEventIds = ['2', '4'] // User has saved these events

  // Filter events by category
  const upcomingEvents = events.filter(
    (event) =>
      (event.organizerId === user.id || event.participants.includes(user.id)) &&
      isFuture(event.date)
  )

  const pastEvents = events.filter(
    (event) =>
      (event.organizerId === user.id || event.participants.includes(user.id)) &&
      isPast(event.date)
  )

  const savedEvents = events.filter(
    (event) =>
      savedEventIds.includes(event.id) &&
      isFuture(event.date) &&
      !event.participants.includes(user.id) // Not already joined
  )

  const renderEventCard = (
    event: any,
    showSaveButton = false,
    showUnsaveButton = false
  ) => {
    const venue = venues.find((v) => v.id === event.venueId)

    return (
      <div
        key={event.id}
        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {event.sport === 'football' && '⚽'}
              {event.sport === 'basketball' && '🏀'}
              {event.sport === 'handball' && '🤾'}
              {event.sport === 'ice-hockey' && '🏒'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-600">
                by {users.find((u) => u.id === event.organizerId)?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={event.status === 'open' ? 'success' : 'info'}>
              {event.status}
            </Badge>
            {event.organizerId === user.id && (
              <Badge variant="warning">Organizer</Badge>
            )}
            {showUnsaveButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Heart size={14} className="fill-current" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            {format(event.date, 'EEEE, MMM d, yyyy')}
          </div>
          <div className="flex items-center">
            <Clock size={14} className="mr-2" />
            {event.startTime} ({event.duration} min)
          </div>
          <div className="flex items-center">
            <MapPin size={14} className="mr-2" />
            {venue?.address?.split(',')[0] || 'Location TBD'}
          </div>
          <div className="flex items-center">
            <Users size={14} className="mr-2" />
            {event.participants.length}/{event.maxParticipants}
            {event.idealParticipants && (
              <span className="text-gray-500 ml-1">
                (ideal: {event.idealParticipants})
              </span>
            )}
          </div>
          {event.price && (
            <div className="flex items-center md:col-span-2">
              <span className="mr-2">€</span>€{event.price} per person
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          {showSaveButton && (
            <Button variant="primary" size="sm">
              Join Game
            </Button>
          )}
          {event.organizerId === user.id && !isPast(event.date) && (
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderEmptyState = (
    icon: React.ReactNode,
    title: string,
    description: string,
    actionButton?: React.ReactNode
  ) => (
    <div className="text-center py-8 text-gray-500">
      <div className="mb-4 text-gray-400">{icon}</div>
      <p className="text-lg font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {actionButton}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info with Recent Activity */}
          <div className="lg:col-span-1">
            <UserProfile user={user} />
          </div>

          {/* Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="text-primary-600 mr-2" size={20} />
                    <h2 className="text-xl font-bold text-gray-900">
                      Upcoming Events
                    </h2>
                    <Badge variant="info" size="sm" className="ml-3">
                      {upcomingEvents.length}
                    </Badge>
                  </div>
                  <Button variant="primary" size="sm">
                    Create New
                  </Button>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Events you're organizing or participating in
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.length > 0
                    ? upcomingEvents.map((event) => renderEventCard(event))
                    : renderEmptyState(
                        <Calendar size={48} className="mx-auto" />,
                        'No upcoming events',
                        "You haven't joined or created any upcoming events yet.",
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate({ to: '/discover' })}
                        >
                          Browse Events
                        </Button>
                      )}
                </div>
              </CardContent>
            </Card>

            {/* Saved Events */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Heart className="text-red-500 mr-2" size={20} />
                    <h2 className="text-xl font-bold text-gray-900">
                      Saved Events
                    </h2>
                    <Badge variant="info" size="sm" className="ml-3">
                      {savedEvents.length}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Events you've saved for later
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {savedEvents.length > 0
                    ? savedEvents.map((event) =>
                        renderEventCard(event, true, true)
                      )
                    : renderEmptyState(
                        <Heart size={48} className="mx-auto" />,
                        'No saved events',
                        'Save interesting events to easily find them later.',
                        <Button variant="outline" size="sm">
                          Discover Events
                        </Button>
                      )}
                </div>
              </CardContent>
            </Card>

            {/* Past Events */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Trophy className="text-yellow-500 mr-2" size={20} />
                    <h2 className="text-xl font-bold text-gray-900">
                      Past Events
                    </h2>
                    <Badge variant="info" size="sm" className="ml-3">
                      {pastEvents.length}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Your sports history and achievements
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastEvents.length > 0
                    ? pastEvents.map((event) => renderEventCard(event))
                    : renderEmptyState(
                        <Trophy size={48} className="mx-auto" />,
                        'No past events',
                        'Your completed events will appear here.',
                        <Button variant="outline" size="sm">
                          Join Your First Event
                        </Button>
                      )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
