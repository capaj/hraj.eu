import React, { useState } from 'react'
import { CreateEventForm, CreateEventFormData } from '../components/events/CreateEventForm'
import { updateEvent } from '../server-functions/updateEvent'
import { cancelEvent } from '../server-functions/cancelEvent'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { i18n } from '~/lib/i18n'
import { msg, Trans, t } from '@lingui/macro'
import { Event, SkillLevel } from '../types'

interface EditEventPageProps {
  event: Event
}

export const EditEventPage: React.FC<EditEventPageProps> = ({ event }) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialData: Partial<CreateEventFormData> = {
    title: event.title,
    sport: event.sport,
    venueId: event.venueId,
    date: new Date(event.date).toISOString().split('T')[0],
    startTime: event.startTime,
    duration: event.duration,
    minParticipants: event.minParticipants,
    idealParticipants: event.idealParticipants,
    maxParticipants: event.maxParticipants,
    cancellationHours: event.cancellationDeadlineHours || 0,
    cancellationMinutes: 0, // Simplified as we only get hours from Event type currently
    price: event.price,
    currency: event.currency || 'CZK',
    paymentDetails: event.paymentDetails,
    gameRules: event.gameRules,
    isPublic: event.isPublic,
    allowedSkillLevels: (event.allowedSkillLevels as SkillLevel[]) || undefined,
    requireSkillLevel: event.requireSkillLevel,
    qrCodeImages: event.qrCodeImages || []
  }

  const handleSubmit = async (eventData: CreateEventFormData) => {
    setIsSubmitting(true)
    try {
      await updateEvent({
        data: {
          id: event.id,
          title: eventData.title,
          sport: eventData.sport,
          venueId: eventData.venueId,
          date: eventData.date,
          startTime: eventData.startTime,
          duration: Number(eventData.duration),
          minParticipants: Number(eventData.minParticipants),
          idealParticipants: eventData.idealParticipants
            ? Number(eventData.idealParticipants)
            : undefined,
          maxParticipants: Number(eventData.maxParticipants),
          cancellationHours: Number(eventData.cancellationHours ?? 0),
          cancellationMinutes: Number(eventData.cancellationMinutes ?? 0),
          price: eventData.price,
          currency: eventData.currency,
          paymentDetails: eventData.paymentDetails,
          gameRules: eventData.gameRules,
          isPublic: Boolean(eventData.isPublic),
          allowedSkillLevels: eventData.allowedSkillLevels,
          requireSkillLevel: Boolean(eventData.requireSkillLevel),
          qrCodeImages: eventData.qrCodeImages
        }
      })
      toast.success(i18n._(msg`Event updated successfully!`))
      navigate({ to: '/events/$eventId', params: { eventId: event.id } })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : i18n._(msg`Failed to update event`)
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: '/events/$eventId', params: { eventId: event.id } })
  }

  const handleCancelEvent = async () => {
    if (!confirm(i18n._(msg`Are you sure you want to cancel this event? This action cannot be undone.`))) {
      return
    }

    try {
      await cancelEvent({ data: { eventId: event.id, reason: 'Cancelled by organizer' } })
      toast.success(i18n._(msg`Event cancelled`))
      navigate({ to: '/events/$eventId', params: { eventId: event.id } })
    } catch (error) {
      toast.error(i18n._(msg`Failed to cancel event`))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreateEventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={initialData}
          onCancelEvent={handleCancelEvent}
        />
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-900">
              <Trans>Updating event...</Trans>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
