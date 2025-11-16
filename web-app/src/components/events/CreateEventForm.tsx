import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Toggle } from '../ui/Toggle'
import { VenueSelector } from '../venues/VenueSelector'
import { AddVenueModal } from '../venues/AddVenueModal'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'
import { getVenues } from '../../lib/server-functions'
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
  description?: string
  paymentDetails?: string
  gameRules?: string
  venueId: string
  idealParticipants: number
}

interface CreateEventFormProps {
  onSubmit: (eventData: CreateEventFormData) => Promise<void> | void
  onCancel: () => void
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSubmit,
  onCancel
}) => {
  // Calculate default date (one week from now) and format it for input
  const getDefaultDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7) // Add 7 days
    return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
  }

  const [formData, setFormData] = useState<CreateEventFormData>({
    title: '',
    sport: '',
    venueId: '', // Changed from address to venueId
    date: getDefaultDate(),
    startTime: '18:00',
    duration: 90,
    minParticipants: 2,
    idealParticipants: 8,
    maxParticipants: 10,
    cancellationHours: 2,
    cancellationMinutes: 0,
    price: '',
    paymentDetails: '',
    gameRules: '',
    isPublic: true,
    allowedSkillLevels: ['beginner', 'intermediate', 'advanced'], // All levels allowed by default
    requireSkillLevel: false // Whether to enforce skill level restrictions
  })

  const [showAddVenueModal, setShowAddVenueModal] = useState(false)
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

  const getTotalCancellationTime = () => {
    const totalMinutes =
      formData.cancellationHours * 60 + formData.cancellationMinutes
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`
    } else if (totalMinutes === 60) {
      return '1 hour'
    } else if (totalMinutes % 60 === 0) {
      return `${Math.floor(totalMinutes / 60)} hours`
    } else {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`
    }
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

  return (
    <>
      <Card className="max-w-4xl mx-auto animate-slide-up">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <p className="text-gray-600">
            Fill in the details to organize your next game
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      handleChange('duration', parseInt(e.target.value))
                    }
                    min="30"
                    max="180"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users size={20} className="mr-2" />
                Participants
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Players *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.minParticipants}
                    onChange={(e) =>
                      handleChange('minParticipants', parseInt(e.target.value))
                    }
                    min="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required to confirm event
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    If fewer than the minimum number of players join by the
                    cancellation deadline, the event will be automatically
                    cancelled and all participants will be notified.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ideal Players *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.idealParticipants}
                    onChange={(e) =>
                      handleChange(
                        'idealParticipants',
                        parseInt(e.target.value)
                      )
                    }
                    min={formData.minParticipants}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Perfect number for best game
                  </p>
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

                <div className="max-w-md">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    value={formData.cancellationHours}
                    onChange={(e) => {
                      let val = e.target.value
                      if (val === '') {
                        handleChange('cancellationHours', 0)
                        return
                      }
                      if (val.startsWith('0') && val.length > 1) {
                        val = val.replace(/^0+/, '') || '0'
                      }
                      const num = parseInt(val, 10)
                      if (!isNaN(num) && num >= 0 && num <= 72) {
                        handleChange('cancellationHours', num)
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.select()
                      }
                    }}
                    min="0"
                    max="72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <Info
                      size={16}
                      className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-blue-800">
                      <strong>Deadline:</strong> {getTotalCancellationTime()}{' '}
                      before the event starts
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
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Price (€)
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
                </div>
                <div>
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
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create Event
              </Button>
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
    </>
  )
}
