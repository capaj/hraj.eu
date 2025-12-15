import React, { useState } from 'react'
import { CreateEventForm } from '../components/events/CreateEventForm'
import type { CreateEventFormData } from '../components/events/CreateEventForm'
// using CreateEventFormData from the form; no need to redeclare based on eventT here
import { useAuthenticate } from '@daveyplate/better-auth-ui'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { createEvent } from '../lib/createEvent'
import { toast } from 'sonner'
import { i18n } from '~/lib/i18n'

// type provided by form

export const CreateEvent: React.FC = () => {
  useAuthenticate() // This is needed to make the auth work
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (eventData: CreateEventFormData) => {
    setIsSubmitting(true)
    try {
      const created = await createEvent({
        data: {
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
          paymentDetails: eventData.paymentDetails,
          gameRules: eventData.gameRules,
          isPublic: Boolean(eventData.isPublic),
          allowedSkillLevels: eventData.allowedSkillLevels,
          requireSkillLevel: Boolean(eventData.requireSkillLevel)
        }
      })
      console.log('Event created:', created)
      toast.success(i18n._(msg`Event created successfully!`))
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : i18n._(msg`Failed to create event`)
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // In a real app, we'd navigate back
    console.log('Create event cancelled')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreateEventForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-900">
              <Trans>Creating event...</Trans>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
