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

import { useQuery } from '@tanstack/react-query'
import { getEventById } from '../server-functions/getEventById'
import { useSearch } from '@tanstack/react-router'
// type provided by form

export const CreateEvent: React.FC = () => {
  useAuthenticate() // This is needed to make the auth work
  const search: any = useSearch({ from: '/create' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const duplicateFromId = search.duplicateFrom

  const { data: duplicateEvent, isLoading: isLoadingDuplicate } = useQuery({
    queryKey: ['duplicateEvent', duplicateFromId],
    queryFn: () => getEventById({ data: duplicateFromId }),
    enabled: !!duplicateFromId
  })

  // Parse duplicate data if available
  let initialData: Partial<CreateEventFormData> | undefined

  if (duplicateEvent) {
    initialData = {
      title: duplicateEvent.title,
      sport: duplicateEvent.sport,
      venueId: duplicateEvent.venueId,
      // No date/time as it will be set to default (next week)
      duration: duplicateEvent.duration,
      minParticipants: duplicateEvent.minParticipants,
      idealParticipants: duplicateEvent.idealParticipants || undefined,
      maxParticipants: duplicateEvent.maxParticipants,
      cancellationHours: duplicateEvent.cancellationDeadlineHours || 2,
      price: duplicateEvent.price,
      currency: duplicateEvent.currency || 'CZK',
      paymentDetails: duplicateEvent.paymentDetails,
      gameRules: duplicateEvent.gameRules,
      isPublic: duplicateEvent.isPublic,
      allowedSkillLevels: (duplicateEvent.allowedSkillLevels as any) || undefined,
      requireSkillLevel: duplicateEvent.requireSkillLevel,
      coreGroupId: duplicateEvent.coreGroupId,
      coreGroupExclusiveUntil: duplicateEvent.coreGroupExclusiveUntil
    }
  } else if (search?.duplicate) {
    try {
      initialData = JSON.parse(decodeURIComponent(search.duplicate))
    } catch (e) {
      console.error('Failed to parse duplicate event data', e)
    }
  }

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
          currency: eventData.currency,
          paymentDetails: eventData.paymentDetails,
          gameRules: eventData.gameRules,
          isPublic: Boolean(eventData.isPublic),
          allowedSkillLevels: eventData.allowedSkillLevels,
          requireSkillLevel: Boolean(eventData.requireSkillLevel),
          coreGroupId: eventData.enableCoreGroup ? eventData.coreGroupId : undefined,
          coreGroupExclusiveHours: eventData.enableCoreGroup ? Number(eventData.coreGroupExclusiveHours) : undefined
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
        <CreateEventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={initialData}
          isEdit={false}
        />
      </div>

      {isLoadingDuplicate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-900">
              <Trans>Loading event details...</Trans>
            </span>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3000]">
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
