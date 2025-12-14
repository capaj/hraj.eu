import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { SPORTS, FACILITIES } from '../../lib/constants'
import { Venue } from '../../types'
import { uploadVenueImages } from '~/server-functions/uploadVenueImages'
import { uploadVenuePlan } from '~/server-functions/uploadVenuePlan'
import { createVenue } from '~/lib/createVenue'
import { updateVenue } from '~/server-functions/updateVenue'
import { getGoogleMapsApiKey } from '~/server-functions/getGoogleMapsApiKey'
import { TagInput } from '../ui/TagInput'
import { AddressAutocomplete, AddressDetails } from './AddressAutocomplete'
import { VenueMapPreview } from './VenueMapPreview'
import {
  X,
  MapPin,
  Upload,
  Image as ImageIcon,
  Euro,
  Plus,
  Edit
} from 'lucide-react'

interface AddVenueModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (venueData: Partial<Venue>) => void
  initialData?: Venue | null
}

export const AddVenueModal: React.FC<AddVenueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('')

  // Fetch Google Maps API key
  useEffect(() => {
    getGoogleMapsApiKey().then((key) => {
      setGoogleMapsApiKey(key)
    })
  }, [])

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        city: initialData.city || '',
        country: initialData.country || 'Czech Republic',
        type: initialData.type || 'outdoor',
        sports: initialData.sports || [],
        facilities: initialData.facilities || [],
        description: initialData.description || '',
        accessInstructions: initialData.accessInstructions || '',
        phone: initialData.contactInfo?.phone || '',
        email: initialData.contactInfo?.email || '',
        website: initialData.contactInfo?.website || '',
        price: initialData.price || 0,
        currency: initialData.currency || 'CZK'
      })
      setImages(initialData.images || [])
      setOrientationPlan(initialData.orientationPlan || '')
      // Set location if available
      if (initialData.lat && initialData.lng) {
        setLocation({ lat: initialData.lat, lng: initialData.lng })
      }
    } else if (isOpen && !initialData) {
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
      setLocation(null)
    }
  }, [isOpen, initialData])

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



  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const handlePlaceSelected = (details: AddressDetails) => {
    // Update form data with address details
    setFormData((prev) => ({
      ...prev,
      address: details.address,
      city: details.city || prev.city,
      country: details.country || prev.country
    }))
    // Update location
    setLocation({ lat: details.lat, lng: details.lng })
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
        lat: location?.lat ?? initialData?.lat ?? 50.0755,
        lng: location?.lng ?? initialData?.lng ?? 14.4378
      }

      let venueId: string
      if (initialData?.id) {
        venueId = await updateVenue({
          data: { ...venueData, id: initialData.id }
        })
      } else {
        venueId = await createVenue({ data: venueData })
      }

      const createdVenue: Partial<Venue> = {
        id: venueId,
        name: venueData.name,
        address: venueData.address ?? '',
        city: venueData.city ?? '',
        country: venueData.country ?? '',
        type: venueData.type ?? 'outdoor',
        sports: venueData.sports ?? [],
        facilities: venueData.facilities ?? [],
        description: venueData.description ?? undefined,
        accessInstructions: venueData.accessInstructions ?? undefined,
        images: venueData.images ?? [],
        orientationPlan: venueData.orientationPlan ?? undefined,
        contactInfo: venueData.contactInfo,
        price: venueData.price ?? 0,
        currency: venueData.currency ?? 'CZK',
        lat: venueData.lat ?? 0,
        lng: venueData.lng ?? 0,
        isVerified: initialData?.isVerified ?? false,
        rating: initialData?.rating ?? undefined,
        totalRatings: initialData?.totalRatings ?? 0,
        createdBy: initialData?.createdBy ?? '',
        createdAt: initialData?.createdAt ?? new Date(),
        updatedAt: new Date()
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
      setLocation(null)
    } catch (error) {
      console.error(
        initialData ? 'Failed to update venue:' : 'Failed to create venue:',
        error
      )
      alert(
        initialData
          ? 'Failed to update venue. Please try again.'
          : 'Failed to create venue. Please try again.'
      )
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
                  {initialData ? 'Edit Venue' : 'Add New Venue'}
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

                <div className="grid grid-cols-2 gap-6">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <AddressAutocomplete
                      value={formData.address}
                      onChange={(value) => handleChange('address', value)}
                      onPlaceSelected={handlePlaceSelected}
                      placeholder="Start typing to search for an address..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      apiKey={googleMapsApiKey}
                    />
                  </div>

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

                {/* Map Preview */}
                {location && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Preview
                    </label>
                    <VenueMapPreview
                      lat={location.lat}
                      lng={location.lng}
                      className="h-64 w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      📍 Coordinates: {location.lat.toFixed(6)},{' '}
                      {location.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Sports */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supported Sports *
                </label>
                <TagInput
                  options={SPORTS}
                  selected={formData.sports}
                  onChange={(selected) => handleChange('sports', selected)}
                  placeholder="Add sports..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select at least one sport. You can add more later.
                </p>
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
                  {FACILITIES.map((facility) => (
                    <label
                      key={facility.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.facilities.includes(facility.id)
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
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
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
                      className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer ${uploadingPlan ? 'opacity-50 cursor-not-allowed' : ''
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
                      {initialData ? 'Updating Venue...' : 'Creating Venue...'}
                    </>
                  ) : (
                    <>
                      {initialData ? (
                        <>
                          <Edit size={16} className="mr-2" />
                          Update Venue
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Create Venue
                        </>
                      )}
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
