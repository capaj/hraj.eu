import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { SPORTS } from '../../lib/constants'
import { Venue } from '../../types'
import { uploadVenueImages, uploadVenuePlan } from '../../lib/server-functions'
import { createVenue } from '~/lib/createVenue'
import {
  X,
  MapPin,
  Upload,
  Image as ImageIcon,
  Euro,
  Plus,
  Info
} from 'lucide-react'

interface AddVenueModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (venueData: Partial<Venue>) => void
}

export const AddVenueModal: React.FC<AddVenueModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: 'Czech Republic',
    type: 'outdoor' as 'outdoor' | 'indoor' | 'mixed',
    sports: [] as string[],
    facilities: [] as string[],
    description: '',
    accessInstructions: '',
    phone: '',
    email: '',
    website: '',
    price: 0,
    currency: 'CZK'
  })

  const [images, setImages] = useState<string[]>([])
  const [orientationPlan, setOrientationPlan] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPlan, setUploadingPlan] = useState(false)

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, isSubmitting, onClose])

  const availableFacilities = [
    { id: 'parking', name: 'Parking', icon: '🚗' },
    { id: 'changing_rooms', name: 'Changing Rooms', icon: '👕' },
    { id: 'showers', name: 'Showers', icon: '🚿' },
    { id: 'equipment_rental', name: 'Equipment Rental', icon: '🛍️' },
    { id: 'cafe', name: 'Café/Restaurant', icon: '☕' },
    { id: 'wifi', name: 'WiFi', icon: '📶' },
    { id: 'first_aid', name: 'First Aid', icon: '🏥' },
    { id: 'accessibility', name: 'Wheelchair Accessible', icon: '♿' }
  ]

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSportToggle = (sportId: string) => {
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports.includes(sportId)
        ? prev.sports.filter((id) => id !== sportId)
        : [...prev.sports, sportId]
    }))
  }

  const handleFacilityToggle = (facilityId: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter((id) => id !== facilityId)
        : [...prev.facilities, facilityId]
    }))
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    setUploadingImage(true)

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('images', file)
      })

      const result = await uploadVenueImages({ data: formData })
      setImages((prev) => [...prev, ...result.urls])
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to upload images. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  const handlePlanUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPlan(true)

    try {
      const formData = new FormData()
      formData.append('plan', file)

      const result = await uploadVenuePlan({ data: formData })
      setOrientationPlan(result.url)
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to upload orientation plan. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingPlan(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.address.trim() ||
      formData.sports.length === 0
    ) {
      alert('Please fill in all required fields and select at least one sport.')
      return
    }

    setIsSubmitting(true)

    try {
      // Create venue data for the server function
      const venueData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country,
        type: formData.type,
        sports: formData.sports,
        facilities: formData.facilities,
        description: formData.description.trim() || undefined,
        accessInstructions: formData.accessInstructions.trim() || undefined,
        images,
        orientationPlan: orientationPlan || undefined,
        contactInfo: {
          phone: formData.phone.trim() || '',
          email: formData.email.trim() || '',
          website: formData.website.trim() || ''
        },
        price: formData.price,
        currency: formData.currency,
        lat: 50.0755 + (Math.random() - 0.5) * 0.1, // Mock coordinates near Prague
        lng: 14.4378 + (Math.random() - 0.5) * 0.1,
        isVerified: false,
        rating: undefined,
        totalRatings: 0
      }

      // Call the server function to create the venue
      const inserted = await createVenue({ data: venueData })
      // inserted is a plain row; build the Venue for UI from inserted + form fallback
      const v = inserted as any

      const createdVenue: Partial<Venue> = {
        id: v?.id,
        name: v?.name ?? venueData.name,
        address: v?.address ?? venueData.address ?? '',
        city: v?.city ?? venueData.city ?? '',
        country: v?.country ?? venueData.country ?? '',
        type: (v?.type as 'outdoor' | 'indoor' | 'mixed') ?? venueData.type ?? 'outdoor',
        sports: v?.sports ?? venueData.sports ?? [],
        facilities: v?.facilities ?? venueData.facilities ?? [],
        description: v?.description ?? venueData.description ?? undefined,
        accessInstructions: v?.accessInstructions ?? venueData.accessInstructions ?? undefined,
        images: v?.images ?? venueData.images ?? [],
        orientationPlan: v?.orientationPlan ?? venueData.orientationPlan ?? undefined,
        contactInfo: {
          phone: v?.contactPhone ?? v?.contactInfo?.phone ?? venueData.contactInfo?.phone ?? '',
          email: v?.contactEmail ?? v?.contactInfo?.email ?? venueData.contactInfo?.email ?? '',
          website: v?.contactWebsite ?? v?.contactInfo?.website ?? venueData.contactInfo?.website ?? ''
        },
        price: v?.price ?? venueData.price ?? 0,
        currency: v?.currency ?? venueData.currency ?? 'CZK',
        lat: v?.lat ?? venueData.lat ?? 0,
        lng: v?.lng ?? venueData.lng ?? 0,
        isVerified: v?.isVerified ?? false,
        rating: v?.rating ?? undefined,
        totalRatings: v?.totalRatings ?? 0,
        createdBy: v?.createdBy ?? '',
        createdAt: v?.createdAt ? new Date(v.createdAt) : new Date(),
        updatedAt: v?.updatedAt ? new Date(v.updatedAt) : new Date()
      }

      onSubmit(createdVenue)
      onClose()

      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        country: 'Czech Republic',
        type: 'outdoor',
        sports: [],
        facilities: [],
        description: '',
        accessInstructions: '',
        phone: '',
        email: '',
        website: '',
        price: 0,
        currency: 'CZK'
      })
      setImages([])
      setOrientationPlan('')
    } catch (error) {
      console.error('Failed to create venue:', error)
      alert('Failed to create venue. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Add New Venue
                </h2>
                <p className="text-gray-600 mt-1">
                  Help grow our community by adding a new sports venue
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <X size={24} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin size={20} className="mr-2 text-primary-600" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Central Park Football Field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="outdoor">Outdoor</option>
                      <option value="indoor">Indoor</option>
                      <option value="mixed">Mixed (Indoor & Outdoor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Prague"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Sports */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Supported Sports *
                </h3>
                <p className="text-sm text-gray-600">
                  Select all sports that can be played at this venue. Select at
                  least one. You can add more later.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {SPORTS.map((sport) => (
                    <label
                      key={sport.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.sports.includes(sport.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.sports.includes(sport.id)}
                        onChange={() => handleSportToggle(sport.id)}
                        className="text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <span className="ml-2 text-lg">{sport.icon}</span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {sport.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Facilities
                </h3>
                <p className="text-sm text-gray-600">
                  Select all facilities available at this venue
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableFacilities.map((facility) => (
                    <label
                      key={facility.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.facilities.includes(facility.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility.id)}
                        onChange={() => handleFacilityToggle(facility.id)}
                        className="text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <span className="ml-2 text-lg">{facility.icon}</span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {facility.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ImageIcon size={20} className="mr-2 text-primary-600" />
                  Venue Images
                </h3>
                <p className="text-sm text-gray-600">
                  Add photos to help players find and recognize the venue
                </p>

                {/* Image Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                    <div className="text-sm text-gray-600 mb-4">
                      <p className="font-medium">Upload venue photos</p>
                      <p>JPG, PNG up to 10MB each</p>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer ${
                        uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Select Images
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Uploaded Images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Venue ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orientation Plan */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Orientation Plan (Optional)
                </h3>
                <p className="text-sm text-gray-600">
                  Upload a map or diagram showing how to access the playing area
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePlanUpload}
                      disabled={uploadingPlan}
                      className="hidden"
                      id="plan-upload"
                    />
                    <label
                      htmlFor="plan-upload"
                      className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer ${
                        uploadingPlan ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingPlan ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          Upload Orientation Plan
                        </>
                      )}
                    </label>

                    {orientationPlan && (
                      <div className="mt-4">
                        <img
                          src={orientationPlan}
                          alt="Orientation plan"
                          className="max-w-xs mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setOrientationPlan('')}
                          className="mt-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description and Access */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleChange('description', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Brief description of the venue..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Instructions
                  </label>
                  <textarea
                    value={formData.accessInstructions}
                    onChange={(e) =>
                      handleChange('accessInstructions', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="How to find and access the playing area..."
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contact Information (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+420 123 456 789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="info@venue.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://venue.com"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Euro size={20} className="mr-2 text-primary-600" />
                  Pricing (Optional)
                </h3>
                <p className="text-sm text-gray-600">
                  Typical hourly rates for this venue
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Hour
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange('priceMin', e.target.value)}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="CZK">CZK (Kč)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || formData.sports.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Venue...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Create Venue
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
