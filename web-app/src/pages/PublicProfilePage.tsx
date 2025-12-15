import React from 'react'
import { useNavigate, useLoaderData } from '@tanstack/react-router'
import { UserProfile } from '../components/user/UserProfile'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EditableEventCard } from '../components/events/EditableEventCard'

import { Calendar, MapPin, Users, Clock, Heart, Trophy } from 'lucide-react'
import { format, isPast, isFuture } from 'date-fns'
import { useAuthenticate } from '@daveyplate/better-auth-ui'
import { useUser } from '~/lib/auth-client'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { i18n } from '~/lib/i18n'

export const PublicProfilePage: React.FC = () => {

  const { notifications, events, venues, users } = useLoaderData({
    from: '/profile'
  })
  const sessionUser = useUser()
  const user = users.find((u) => u.id === sessionUser.id) || (sessionUser as any)
  const navigate = useNavigate()

  // Mock saved events (in a real app, this would come from user's saved events)
  const savedEventIds = ['2', '4'] // User has saved these events

  // Filter events by category
  const upcomingEvents = events.filter(
    (event) =>
      (event.organizerId === user.id || event.participants.includes(user.id)) &&
      isFuture(event.date) &&
      event.status !== 'cancelled'
  )

  const pastEvents = events.filter(
    (event) =>
      (event.organizerId === user.id || event.participants.includes(user.id)) &&
      (isPast(event.date) || event.status === 'cancelled')
  )

  const savedEvents = events.filter(
    (event) =>
      savedEventIds.includes(event.id) &&
      isFuture(event.date) &&
      !event.participants.includes(user.id) // Not already joined
  )



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
                      <Trans>Upcoming Events</Trans>
                    </h2>
                    <Badge variant="info" size="sm" className="ml-3">
                      {upcomingEvents.length}
                    </Badge>
                  </div>

                </div>
                <p className="text-gray-600 text-sm mt-1">
                  <Trans>Events you're organizing or participating in</Trans>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.length > 0
                    ? upcomingEvents.map((event) => (
                      <EditableEventCard
                        key={event.id}
                        event={event}
                        venues={venues}
                        users={users}
                        currentUserId={user?.id}
                      />
                    ))
                    : renderEmptyState(
                      <Calendar size={48} className="mx-auto" />,
                      i18n._(msg`No upcoming events`),
                      i18n._(
                        msg`You haven't joined or created any upcoming events yet.`
                      ),
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate({ to: '/discover' })}
                      >
                        <Trans>Browse Events</Trans>
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
                      <Trans>Saved Events</Trans>
                    </h2>
                    <Badge variant="info" size="sm" className="ml-3">
                      {savedEvents.length}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  <Trans>Events you've saved for later</Trans>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {savedEvents.length > 0
                    ? savedEvents.map((event) => (
                      <EditableEventCard
                        key={event.id}
                        event={event}
                        venues={venues}
                        users={users}
                        currentUserId={user?.id}
                        showSaveButton
                        showUnsaveButton
                      />
                    ))
                    : renderEmptyState(
                      <Heart size={48} className="mx-auto" />,
                      i18n._(msg`No saved events`),
                      i18n._(msg`Save interesting events to easily find them later.`),
                      <Button variant="outline" size="sm">
                        <Trans>Discover Events</Trans>
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
                      <Trans>Past Events</Trans>
                    </h2>
                    <Badge variant="info" size="sm" className="ml-3">
                      {pastEvents.length}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  <Trans>Your sports history and achievements</Trans>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastEvents.length > 0
                    ? pastEvents.map((event) => (
                      <EditableEventCard
                        key={event.id}
                        event={event}
                        venues={venues}
                        users={users}
                        currentUserId={user?.id}
                      />
                    ))
                    : renderEmptyState(
                      <Trophy size={48} className="mx-auto" />,
                      i18n._(msg`No past events`),
                      i18n._(msg`Your completed events will appear here.`),
                      <Button variant="outline" size="sm">
                        <Trans>Join Your First Event</Trans>
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
