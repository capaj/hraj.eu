import React, { useState } from 'react'
import { CreateEventForm, CreateEventFormData } from '../components/events/CreateEventForm'
import { updateEvent } from '../server-functions/updateEvent'
import { cancelEvent } from '../server-functions/cancelEvent'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { i18n } from '~/lib/i18n'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { Event, SkillLevel } from '../types'
import { useAuthSession } from '../lib/auth-client'

interface EditEventPageProps {
  event: Event
}

export const EditEventPage: React.FC<EditEventPageProps> = ({ event }) => {
  const navigate = useNavigate()
  const session = useAuthSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canCancelEvent =
    session.data?.user?.id === event.organizerId &&
    (event.status === 'open' || event.status === 'confirmed')

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
    reservedParticipants: event.reservedParticipants ?? 0,
    cancellationHours: event.cancellationDeadlineHours || 0,
    cancellationMinutes: 0, // Simplified as we only get hours from Event type currently
    price: event.price,
    currency: event.currency || 'CZK',
    paymentDetails: event.paymentDetails,
    gameRules: event.gameRules,
    isPublic: event.isPublic,
    allowedSkillLevels: (event.allowedSkillLevels as SkillLevel[]) || undefined,
    requireSkillLevel: event.requireSkillLevel,
    qrCodeImages: event.qrCodeImages || [],
    coreGroupId: event.coreGroupId,
    coreGroupExclusiveUntil: event.coreGroupExclusiveUntil
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
          reservedParticipants: Number(eventData.reservedParticipants ?? 0),
          cancellationHours: Number(eventData.cancellationHours ?? 0),
          cancellationMinutes: Number(eventData.cancellationMinutes ?? 0),
          price: eventData.price,
          currency: eventData.currency,
          paymentDetails: eventData.paymentDetails,
          gameRules: eventData.gameRules,
          isPublic: Boolean(eventData.isPublic),
          allowedSkillLevels: eventData.allowedSkillLevels,
          requireSkillLevel: Boolean(eventData.requireSkillLevel),
          coreGroupId: eventData.enableCoreGroup ? eventData.coreGroupId : undefined,
          coreGroupExclusiveHours: eventData.enableCoreGroup ? Number(eventData.coreGroupExclusiveHours) : undefined,
          qrCodeImages: eventData.qrCodeImages,
          clearCoreGroup: !eventData.enableCoreGroup
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

  const handleCancelEvent = async (reason?: string) => {
    try {
      await cancelEvent({
        data: {
          eventId: event.id,
          reason: reason?.trim() || undefined
        }
      })
      toast.success(i18n._(msg`Event cancelled`))
      navigate({ to: '/events/$eventId', params: { eventId: event.id } })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to cancel event`)
      )
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreateEventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={initialData}
          onCancelEvent={canCancelEvent ? handleCancelEvent : undefined}
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
