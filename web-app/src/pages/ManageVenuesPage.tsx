import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Venue } from '../types'
import { getVenuesByUserId } from '~/server-functions/getVenuesByUserId'
import { useUser } from '~/lib/auth-client'
import { AddVenueModal } from '../components/venues/AddVenueModal'
import {
  MapPin,
  Edit,
  Plus,
  Building2,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  Globe,
  Euro
} from 'lucide-react'
import { SPORTS } from '../lib/constants'
import { format } from 'date-fns'

export const ManageVenuesPage: React.FC = () => {
  const user = useUser()
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }
    loadVenues()
  }, [user?.id])

  const loadVenues = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const userVenues = await getVenuesByUserId({ data: user.id })
      setVenues(userVenues)
    } catch (error) {
      console.error('Failed to load venues:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddVenue = () => {
    setEditingVenue(null)
    setIsAddModalOpen(true)
  }

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue(venue)
    setIsAddModalOpen(true)
  }

  const handleVenueSubmit = async (_venueData: Partial<Venue>) => {
    await loadVenues()
    setIsAddModalOpen(false)
    setEditingVenue(null)
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    setEditingVenue(null)
  }

  const getSportIcon = (sportId: string) => {
    const sport = SPORTS.find((s) => s.id === sportId)
    return sport?.icon || '🏟️'
  }

  const renderVenueCard = (venue: Venue) => {
    return (
      <Card key={venue.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {venue.name}
                </h3>
                {venue.isVerified && (
                  <Badge variant="success" size="sm">
                    <CheckCircle size={12} className="mr-1" />
                    Verified
                  </Badge>
                )}
                {!venue.isVerified && (
                  <Badge variant="warning" size="sm">
                    <XCircle size={12} className="mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin size={16} className="mr-2" />
                <span>
                  {venue.address}, {venue.city}, {venue.country}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Building2 size={14} className="mr-1" />
                  {venue.type}
                </div>
                {venue.price > 0 && (
                  <div className="flex items-center">
                    <Euro size={14} className="mr-1" />
                    {venue.price} {venue.currency}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Added {format(venue.createdAt, 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditVenue(venue)}
            >
              <Edit size={16} className="mr-2" />
              Edit
            </Button>
          </div>

          {venue.description && (
            <p className="text-gray-700 mb-4 line-clamp-2">
              {venue.description}
            </p>
          )}

          {venue.sports.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Sports:
              </h4>
              <div className="flex flex-wrap gap-2">
                {venue.sports.map((sportId) => (
                  <Badge key={sportId} variant="info" size="sm">
                    <span className="mr-1">{getSportIcon(sportId)}</span>
                    {SPORTS.find((s) => s.id === sportId)?.name || sportId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {venue.facilities.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Facilities:
              </h4>
              <div className="flex flex-wrap gap-2">
                {venue.facilities.map((facility) => (
                  <Badge key={facility} variant="default" size="sm">
                    {facility}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {venue.contactInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
              {venue.contactInfo.phone && (
                <div className="flex items-center">
                  <Phone size={14} className="mr-2" />
                  {venue.contactInfo.phone}
                </div>
              )}
              {venue.contactInfo.email && (
                <div className="flex items-center">
                  <Mail size={14} className="mr-2" />
                  {venue.contactInfo.email}
                </div>
              )}
              {venue.contactInfo.website && (
                <div className="flex items-center">
                  <Globe size={14} className="mr-2" />
                  <a
                    href={venue.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>
          )}

          {venue.images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {venue.images.slice(0, 3).map((image, idx) => (
                <img
                  key={idx}
                  src={image}
                  alt={`${venue.name} ${idx + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Building2 className="mr-3 text-white" size={32} />
                Manage Venues
              </h1>
              <p className="text-white/80 mt-2">
                View and edit venues you've added to the platform
              </p>
            </div>
            <Button variant="primary" onClick={handleAddVenue}>
              <Plus size={16} className="mr-2" />
              Add New Venue
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading venues...</p>
            </CardContent>
          </Card>
        ) : venues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No venues yet
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't added any venues yet. Start by adding your first
                venue!
              </p>
              <Button variant="primary" onClick={handleAddVenue}>
                <Plus size={16} className="mr-2" />
                Add Your First Venue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {venues.map((venue) => renderVenueCard(venue))}
          </div>
        )}

        {isAddModalOpen && (
          <AddVenueModal
            isOpen={isAddModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleVenueSubmit}
            initialData={editingVenue}
          />
        )}
      </div>
    </div>
  )
}
