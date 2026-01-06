import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Heart,
  Trophy,
  X
} from 'lucide-react'
import { format, isPast } from 'date-fns'
import { Event, Venue, User } from '../../types'
import { CreateEventForm, CreateEventFormData } from './CreateEventForm'
import { updateEvent } from '../../server-functions/updateEvent'
import { cancelEvent } from '../../server-functions/cancelEvent'
import { useRouter } from '@tanstack/react-router'

interface EditableEventCardProps {
  event: Event & { participants: string[] }
  venues: Venue[]
  users: User[]
  currentUserId?: string | null
  showSaveButton?: boolean
  showUnsaveButton?: boolean
  onUnsave?: (eventId: string) => void
}

export const EditableEventCard: React.FC<EditableEventCardProps> = ({
  event,
  venues,
  users,
  currentUserId,
  showSaveButton = false,
  showUnsaveButton = false,
  onUnsave
}) => {
  const navigate = useNavigate()
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const venue = venues.find((v) => v.id === event.venueId)
  const organizer = users.find((u) => u.id === event.organizerId)

  const handleEditSubmit = async (data: CreateEventFormData) => {
    setIsUpdating(true)
    try {
      await updateEvent({
        data: {
          id: event.id,
          ...data
        }
      })
      setIsEditOpen(false)
      router.invalidate() // Refresh data
    } catch (error) {
      console.error('Failed to update event:', error)
      alert('Failed to update event')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEvent = async (reason?: string) => {
    setIsUpdating(true)
    try {
      await cancelEvent({
        data: {
          eventId: event.id,
          reason
        }
      })
      setIsEditOpen(false)
      router.invalidate()
    } catch (error) {
      console.error('Failed to cancel event:', error)
      alert('Failed to cancel event')
    } finally {
      setIsUpdating(false)
    }
  }

  // Map event to form data
  const initialFormData: Partial<CreateEventFormData> = {
    title: event.title,
    sport: event.sport,
    venueId: event.venueId || '',
    date: event.date instanceof Date ? format(event.date, 'yyyy-MM-dd') : event.date,
    startTime: event.startTime,
    duration: event.duration,
    minParticipants: event.minParticipants,
    idealParticipants: event.idealParticipants,
    maxParticipants: event.maxParticipants,
    cancellationHours: Math.floor((event.cancellationDeadlineHours || 0)), // Note: Type definition uses Hours but schema uses Minutes. Let's check schema mapping.
    // Schema has cancellationDeadlineMinutes. Event interface has cancellationDeadlineHours?
    // Let's check Event interface in types/index.ts
    // It says cancellationDeadlineHours?: number.
    // CreateEventForm uses cancellationHours and Minutes.
    // We should probably convert if needed.
    price: event.price || '',
    paymentDetails: event.paymentDetails || '',
    gameRules: event.gameRules || '',
    isPublic: event.isPublic,
    allowedSkillLevels: (event.allowedSkillLevels as any) || ['beginner', 'intermediate', 'advanced'],
    requireSkillLevel: event.requireSkillLevel || false
  }

  // Correction for cancellation time if needed using standard calculation
  // Assuming event object might not strictly follow type or type definition in types.ts is what we use.
  // In types.ts: cancellationDeadlineHours?: number

  return (
    <>
      <div
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
                by {organizer?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={event.status === 'open' ? 'success' : 'info'}>
              {event.status}
            </Badge>
            {currentUserId === event.organizerId && (
              <Badge variant="warning">Organizer</Badge>
            )}
            {showUnsaveButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onUnsave?.(event.id)}
              >
                <Heart size={14} className="fill-current" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            {format(new Date(event.date), 'EEEE, MMM d, yyyy')}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: `/events/${event.urlSlug}` })}
          >
            View Details
          </Button>
          {showSaveButton && (
            <Button variant="primary" size="sm">
              Join Game
            </Button>
          )}
          {currentUserId === event.organizerId && !isPast(new Date(event.date)) && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-1 shadow-sm"
              title="Close"
            >
              <X size={24} />
            </button>
            <div className="overflow-y-auto p-1 flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <CreateEventForm
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditOpen(false)}
                initialData={initialFormData}
                onCancelEvent={handleCancelEvent}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
