import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Toggle } from '../ui/Toggle'
import { VenueSelector } from '../venues/VenueSelector'
import { AddVenueModal } from '../venues/AddVenueModal'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'
import { getVenues } from '~/server-functions/getVenues'
import { Venue, type SkillLevel } from '../../types'
import { eventT } from '../../../drizzle/schema'
import {
  MapPin,
  Calendar,
  Users,
  Euro,
  FileText,
  Info,
  Shield,
  AlertTriangle
} from 'lucide-react'

export type CreateEventFormData = Omit<
  typeof eventT.$inferInsert,
  | 'cancellationDeadlineMinutes'
  | 'organizerId'
  | 'requiredSkillLevel'
  | 'status'
  | 'cancellationReason'
  | 'createdAt'
  | 'updatedAt'
  | 'id'
  | 'price'
  | 'description'
  | 'paymentDetails'
  | 'gameRules'
  | 'venueId'
  | 'idealParticipants'
> & {
  cancellationHours: number
  cancellationMinutes: number
  allowedSkillLevels: SkillLevel[]
  requireSkillLevel: boolean
  price?: number | ''
  currency: string
  description?: string
  paymentDetails?: string
  gameRules?: string
  venueId: string
  idealParticipants: number
}

interface CreateEventFormProps {
  onSubmit: (eventData: CreateEventFormData) => Promise<void> | void
  onCancel: () => void
  initialData?: Partial<CreateEventFormData>
  onCancelEvent?: (reason?: string) => Promise<void> | void
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  onCancelEvent
}) => {
  // Calculate default date (one week from now) and format it for input
  const getDefaultDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7) // Add 7 days
    return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
  }

  const [formData, setFormData] = useState<CreateEventFormData>({
    title: initialData?.title || '',
    sport: initialData?.sport || '',
    venueId: initialData?.venueId || '',
    date: initialData?.date || getDefaultDate(),
    startTime: initialData?.startTime || '18:00',
    duration: initialData?.duration || 90,
    minParticipants: initialData?.minParticipants || 2,
    idealParticipants: initialData?.idealParticipants || 8,
    maxParticipants: initialData?.maxParticipants || 10,
    cancellationHours: initialData?.cancellationHours ?? 2,
    cancellationMinutes: initialData?.cancellationMinutes ?? 0,
    price: initialData?.price || '',
    currency: initialData?.currency || 'CZK',
    paymentDetails: initialData?.paymentDetails || '',
    gameRules: initialData?.gameRules || '',
    isPublic: initialData?.isPublic ?? true,
    allowedSkillLevels: initialData?.allowedSkillLevels || ['beginner', 'intermediate', 'advanced'],
    requireSkillLevel: initialData?.requireSkillLevel || false
  })

  const [showAddVenueModal, setShowAddVenueModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoadingVenues, setIsLoadingVenues] = useState(true)

  // Fetch venues from database
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setIsLoadingVenues(true)
        const venuesData = await getVenues()
        setVenues(venuesData)
      } catch (error) {
        console.error('Failed to load venues:', error)
      } finally {
        setIsLoadingVenues(false)
      }
    }
    fetchVenues()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate venue selection
    if (!formData.venueId) {
      alert('Please select a venue for your event.')
      return
    }

    onSubmit(formData)
  }

  const handleChange = (field: keyof CreateEventFormData, value: unknown) => {
    setFormData((prev) => {
      const newData: CreateEventFormData = { ...prev, [field]: value as any }

      // Auto-adjust ideal and max when min changes
      if (field === 'minParticipants') {
        const v = value as number
        if (newData.idealParticipants < v) {
          newData.idealParticipants = v
        }
        if (newData.maxParticipants < v) {
          newData.maxParticipants = v
        }
      }

      // Auto-adjust max when ideal changes
      if (field === 'idealParticipants') {
        const v = value as number
        if (newData.maxParticipants < v) {
          newData.maxParticipants = v
        }
      }

      // Auto-adjust min/ideal when max changes
      if (field === 'maxParticipants') {
        const v = value as number
        if (Number.isFinite(v)) {
          if (v >= 2) {
            if (newData.idealParticipants > v) {
              newData.idealParticipants = v
            }
            if (newData.minParticipants > v) {
              newData.minParticipants = v
            }
          }
        }
      }

      return newData
    })
  }

  const handleSkillLevelToggle = (skillLevel: SkillLevel) => {
    setFormData((prev) => {
      const currentLevels = prev.allowedSkillLevels
      const isCurrentlyAllowed = currentLevels.includes(skillLevel)

      let newAllowedLevels
      if (isCurrentlyAllowed) {
        // Remove the skill level (but ensure at least one remains)
        newAllowedLevels = currentLevels.filter((level) => level !== skillLevel)
        if (newAllowedLevels.length === 0) {
          // Don't allow removing all skill levels
          return prev
        }
      } else {
        // Add the skill level
        newAllowedLevels = [...currentLevels, skillLevel]
      }

      return {
        ...prev,
        allowedSkillLevels: newAllowedLevels
      }
    })
  }

  const handleVenueSelect = (venueId: string) => {
    handleChange('venueId', venueId)
    const selectedVenue = venues.find((v) => v.id === venueId)
    if (selectedVenue?.currency) {
      handleChange('currency', selectedVenue.currency)
    }
  }

  const handleAddVenue = (venueData: Partial<Venue>) => {
    // In a real app, this would make an API call to create the venue
    const newVenue: Venue = {
      id: `venue-${Date.now()}`,
      ...venueData,
      createdBy: '1', // Current user ID
      isVerified: false,
      rating: undefined,
      totalRatings: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Venue

    setVenues((prev) => [...prev, newVenue])
    handleChange('venueId', newVenue.id)

    console.log('New venue created:', newVenue)
    alert(
      'Venue created successfully! It will be reviewed by our team before being made available to all users.'
    )
  }

  const getTotalCancellationParts = () => {
    const totalMinutes =
      formData.cancellationHours * 60 + formData.cancellationMinutes
    if (totalMinutes < 60) {
      return { primary: `${totalMinutes} minutes`, secondary: '' }
    } else if (totalMinutes === 60) {
      return { primary: '1 hour', secondary: '' }
    } else if (totalMinutes % 60 === 0) {
      return {
        primary: `${Math.floor(totalMinutes / 60)} hours`,
        secondary: ''
      }
    } else {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return {
        primary: `${hours} hour${hours > 1 ? 's' : ''}`,
        secondary: `${minutes} minutes`
      }
    }
  }

  const getCancellationDeadlineTimeLabel = () => {
    if (!formData.date || !formData.startTime) {
      return null
    }
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
    if (Number.isNaN(startDateTime.getTime())) {
      return null
    }
    const totalMinutes =
      formData.cancellationHours * 60 + formData.cancellationMinutes
    const deadlineTime = new Date(
      startDateTime.getTime() - totalMinutes * 60 * 1000
    )
    const hours = deadlineTime.getHours().toString().padStart(2, '0')
    const minutes = deadlineTime.getMinutes().toString().padStart(2, '0')
    const timeLabel = `${hours}:${minutes}`
    if (deadlineTime.toDateString() !== startDateTime.toDateString()) {
      return `${timeLabel} (day before)`
    }
    return timeLabel
  }

  const getEndTimeLabel = () => {
    if (!formData.startTime || !formData.duration) {
      return null
    }
    const [hours, minutes] = formData.startTime.split(':').map(Number)
    const durationMinutes = Number(formData.duration)
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      !Number.isFinite(durationMinutes)
    ) {
      return null
    }
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const dayOffset = Math.floor(totalMinutes / (24 * 60))
    const endMinutes = totalMinutes % (24 * 60)
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const timeLabel = `${endHours.toString().padStart(2, '0')}:${endMins
      .toString()
      .padStart(2, '0')}`
    if (dayOffset > 0) {
      return `${timeLabel} (+${dayOffset} day${dayOffset > 1 ? 's' : ''})`
    }
    return timeLabel
  }

  const getPerPlayerCost = () => {
    if (!formData.price) {
      return null
    }
    const totalPrice = Number(formData.price)
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return null
    }
    const participants = formData.idealParticipants || formData.minParticipants
    if (!participants) {
      return null
    }
    const perPlayer = totalPrice / participants
    if (!Number.isFinite(perPlayer) || perPlayer <= 0) {
      return null
    }
    return perPlayer
  }

  const getSkillLevelBadgeVariant = (level: SkillLevel) => {
    switch (level) {
      case 'beginner':
        return 'success' as const
      case 'intermediate':
        return 'warning' as const
      case 'advanced':
        return 'error' as const
      default:
        return 'default' as const
    }
  }

  const getSkillLevelDescription = (levels: SkillLevel[]) => {
    if (levels.length === 3) {
      return 'All skill levels welcome'
    } else if (levels.length === 2) {
      const levelNames = levels
        .map((level) => SKILL_LEVELS.find((l) => l.id === level)?.name)
        .join(' and ')
      return `${levelNames} players only`
    } else {
      const levelName = SKILL_LEVELS.find((l) => l.id === levels[0])?.name
      return `${levelName} players only`
    }
  }

  const _selectedVenue = venues.find((v) => v.id === formData.venueId)
  const participantsRangeMax = Number.isFinite(formData.maxParticipants)
    ? Math.max(formData.maxParticipants, 2)
    : 2
  const cancellationTotalMinutes =
    formData.cancellationHours * 60 + formData.cancellationMinutes
  const cancellationSliderValue = Math.min(
    1440,
    Math.max(15, cancellationTotalMinutes)
  )
  const endTimeLabel = getEndTimeLabel()
  const perPlayerCost = getPerPlayerCost()
  const durationPresets = [60, 90, 120]
  const cancellationTimeParts = getTotalCancellationParts()
  const cancellationTimeInline = cancellationTimeParts.secondary
    ? `${cancellationTimeParts.primary} ${cancellationTimeParts.secondary}`
    : cancellationTimeParts.primary
  const cancellationDeadlineTime = getCancellationDeadlineTimeLabel()

  return (
    <>
      <Card className="max-w-4xl mx-auto animate-slide-up">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-gray-600">
            {initialData
              ? 'Update the details of your event'
              : 'Fill in the details to organize your next game'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <select
                required
                value={formData.sport}
                onChange={(e) => handleChange('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a sport</option>
                {SPORTS.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Venue Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin size={20} className="mr-2" />
                  Venue Selection
                </h3>
                {formData.sport && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-blue-800">
                      Showing venues that support{' '}
                      <strong>
                        {SPORTS.find((s) => s.id === formData.sport)?.name}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {formData.sport &&
                _selectedVenue &&
                !_selectedVenue.sports.includes(formData.sport) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={16}
                        className="text-amber-600 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-sm text-amber-800">
                        <strong>Warning:</strong> The selected venue{' '}
                        <strong>{_selectedVenue.name}</strong> does not support{' '}
                        <strong>
                          {SPORTS.find((s) => s.id === formData.sport)?.name}
                        </strong>
                        . Please select a different sport or choose a different
                        venue.
                      </div>
                    </div>
                  </div>
                )}

              {isLoadingVenues ? (
                <div className="text-gray-500">Loading venues...</div>
              ) : (
                <VenueSelector
                  venues={venues}
                  selectedVenueId={formData.venueId}
                  onVenueSelect={handleVenueSelect}
                  onAddVenue={() => setShowAddVenueModal(true)}
                  sportFilter={formData.sport}
                />
              )}
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Sunday Football at the Park"
              />
            </div>

            {/* Game Rules - Moved to replace Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText size={20} className="mr-2" />
                Game Rules (Optional)
              </h3>
              <textarea
                value={formData.gameRules}
                onChange={(e) => handleChange('gameRules', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="No slide tackles, bring light/dark shirt, call your own fouls..."
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar size={20} className="mr-2" />
                Date & Time
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="durationRange"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Duration (minutes)
                    </label>
                    <span className="text-sm font-semibold text-gray-900">
                      {formData.duration} min
                    </span>
                  </div>
                  <input
                    id="durationRange"
                    type="range"
                    value={formData.duration}
                    onChange={(e) =>
                      handleChange('duration', parseInt(e.target.value, 10))
                    }
                    min="30"
                    max="180"
                    step="10"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 mt-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>30m</span>
                    <span>60m</span>
                    <span>120m</span>
                    <span>180m</span>
                  </div>
                  {endTimeLabel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ends at {endTimeLabel}
                    </p>
                  )}

                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users size={20} className="mr-2" />
                Participants
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="minParticipants"
                        className="text-sm font-medium text-gray-700"
                      >
                        Minimum Players *
                      </label>
                      <span className="text-lg font-semibold text-gray-900">
                        {formData.minParticipants}
                      </span>
                    </div>
                    <input
                      id="minParticipants"
                      type="range"
                      value={formData.minParticipants}
                      min="2"
                      max={participantsRangeMax}
                      step="1"
                      onChange={(e) =>
                        handleChange(
                          'minParticipants',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 mt-3"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2</span>
                      <span>{participantsRangeMax}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Required to confirm event
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      If fewer than the minimum number of players join by the
                      cancellation deadline, the event will be automatically
                      cancelled and all participants will be notified.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="idealParticipants"
                        className="text-sm font-medium text-gray-700"
                      >
                        Ideal Players *
                      </label>
                      <span className="text-lg font-semibold text-gray-900">
                        {formData.idealParticipants}
                      </span>
                    </div>
                    <input
                      id="idealParticipants"
                      type="range"
                      value={formData.idealParticipants}
                      min={formData.minParticipants}
                      max={participantsRangeMax}
                      step="1"
                      onChange={(e) =>
                        handleChange(
                          'idealParticipants',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 mt-3"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formData.minParticipants}</span>
                      <span>{participantsRangeMax}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Perfect number for the best game
                    </p>
                  </div>


                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Players *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      handleChange('maxParticipants', parseInt(e.target.value))
                    }
                    min={formData.idealParticipants}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum capacity</p>
                  <p className="text-xs text-blue-700 mt-2">
                    Any extra players will be put on a waitlist
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Increase max players to widen the sliders.
                  </p>
                </div>
              </div>

              {/* Cancellation Timing */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Cancellation Deadline *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  How long before the event should we check if there are enough
                  players?
                </p>

                <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Deadline
                    </span>
                    <div className="text-right text-gray-900">
                      <div className="text-lg font-semibold leading-tight">
                        {cancellationTimeParts.primary}
                      </div>
                      <div className="text-sm text-gray-600 min-h-[1.25rem]">
                        {cancellationTimeParts.secondary}
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="1440"
                    step="15"
                    value={cancellationSliderValue}
                    onChange={(e) => {
                      const total = parseInt(e.target.value, 10)
                      const hours = Math.floor(total / 60)
                      const minutes = total % 60
                      handleChange('cancellationHours', hours)
                      handleChange('cancellationMinutes', minutes)
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 mt-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>15m</span>
                    <span>6h</span>
                    <span>12h</span>
                    <span>24h</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <Info
                      size={16}
                      className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-blue-800">
                      <strong>Deadline:</strong>{' '}
                      {cancellationDeadlineTime ||
                        `${cancellationTimeInline} before the event starts`}
                      {formData.date && formData.startTime && (
                        <div className="mt-1 text-blue-700">
                          We'll check for minimum players and decide whether to
                          proceed or cancel the event.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Level Restrictions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-900 flex items-center">
                  <Shield size={18} className="mr-2 text-primary-600" />
                  Skill Level Requirements
                </h4>
                <Toggle
                  checked={formData.requireSkillLevel}
                  onChange={(checked) =>
                    handleChange('requireSkillLevel', checked)
                  }
                >
                  Enforce skill level restrictions
                </Toggle>
              </div>

              {formData.requireSkillLevel ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select which skill levels are allowed to join this event.
                    Only players with these skill levels in{' '}
                    {formData.sport
                      ? SPORTS.find((s) => s.id === formData.sport)?.name
                      : 'the selected sport'}{' '}
                    will be able to join.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SKILL_LEVELS.map((level) => {
                      const lvl = level.id as SkillLevel
                      const isSelected =
                        formData.allowedSkillLevels.includes(lvl)
                      const isOnlySelected =
                        formData.allowedSkillLevels.length === 1 && isSelected

                      return (
                        <label
                          key={level.id}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                            } ${isOnlySelected ? 'opacity-75' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSkillLevelToggle(lvl)}
                            disabled={isOnlySelected}
                            className="text-primary-600 focus:ring-primary-500 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {level.name}
                              </span>
                              <Badge
                                variant={getSkillLevelBadgeVariant(level.id)}
                                size="sm"
                              >
                                {level.name}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {level.id === 'beginner' &&
                                'New to the sport or casual players'}
                              {level.id === 'intermediate' &&
                                'Regular players with some experience'}
                              {level.id === 'advanced' &&
                                'Experienced competitive players'}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  {/* Current Selection Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info
                        size={16}
                        className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Current Restriction</p>
                        <p>
                          {getSkillLevelDescription(
                            formData.allowedSkillLevels
                          )}
                        </p>
                        {formData.allowedSkillLevels.length < 3 && (
                          <p className="mt-2 text-blue-700">
                            Players without the required skill level in{' '}
                            {formData.sport
                              ? SPORTS.find((s) => s.id === formData.sport)
                                ?.name
                              : 'this sport'}{' '}
                            will not be able to join this event.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info
                      size={16}
                      className="text-gray-600 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">
                        Open to All Skill Levels
                      </p>
                      <p>
                        When skill level restrictions are disabled, players of
                        any skill level can join your event. This is great for
                        casual games and welcoming new players to the sport.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Euro size={20} className="mr-2" />
                Payment (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      handleChange(
                        'price',
                        e.target.value ? parseFloat(e.target.value) : ''
                      )
                    }
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Will be divided by participant count
                  </p>
                  {perPlayerCost && (
                    <p className="text-xs text-gray-600 mt-2">
                      ~{perPlayerCost.toFixed(2)} {formData.currency} per player
                      (based on ideal players)
                    </p>
                  )}
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="CZK">CZK (Kč)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Details
                  </label>
                  <input
                    type="text"
                    value={formData.paymentDetails}
                    onChange={(e) =>
                      handleChange('paymentDetails', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Revolut: @username or cash on spot"
                  />
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Visibility
              </h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.isPublic}
                    onChange={() => handleChange('isPublic', true)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Public (discoverable by everyone)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!formData.isPublic}
                    onChange={() => handleChange('isPublic', false)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Private (invite-only)
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div>
                {initialData && onCancelEvent && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Event
                  </Button>
                )}
              </div>
              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Close
                </Button>
                <Button type="submit" variant="primary">
                  {initialData ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add Venue Modal */}
      <AddVenueModal
        isOpen={showAddVenueModal}
        onClose={() => setShowAddVenueModal(false)}
        onSubmit={handleAddVenue}
      />

      {/* Cancel Event Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3060] p-4">
          <Card className="w-full max-w-md animate-fade-in">
            <CardHeader>
              <h3 className="text-xl font-bold text-red-600">Cancel Event?</h3>
              <p className="text-sm text-gray-600">Are you sure you want to cancel this event? This action cannot be undone.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason (Optional)
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Weather conditions, Insufficient players..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                    Keep Event
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (onCancelEvent) {
                        onCancelEvent(cancellationReason);
                        setShowCancelConfirm(false);
                      }
                    }}
                  >
                    Yes, Cancel Event
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
