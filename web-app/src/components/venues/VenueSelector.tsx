import React, { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Venue } from '../../types'
import { SPORTS } from '../../lib/constants'
import { Trans } from '@lingui/react/macro'
import { t, msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import {
  MapPin,
  Plus,
  Search,
  Star,
  Users,
  Car,
  Wifi,
  Coffee,
  Droplets,
  ShoppingBag,
  Building,
  Check,
  X
} from 'lucide-react'

interface VenueSelectorProps {
  venues: Venue[]
  selectedVenueId?: string
  onVenueSelect: (venueId: string) => void
  onAddVenue: () => void
  sportFilter?: string // Filter venues by sport
}

export const VenueSelector: React.FC<VenueSelectorProps> = ({
  venues,
  selectedVenueId,
  onVenueSelect,
  onAddVenue,
  sportFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAllVenues, setShowAllVenues] = useState(false)

  // Filter venues based on search term and sport
  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSport = !sportFilter || venue.sports.includes(sportFilter)

    return matchesSearch && matchesSport
  })

  // Filter out selected venue from the list
  const venuesWithoutSelected = filteredVenues.filter(
    (venue) => venue.id !== selectedVenueId
  )

  // Show only top 3 venues initially, unless "show all" is clicked
  const displayedVenues = showAllVenues
    ? venuesWithoutSelected
    : venuesWithoutSelected.slice(0, 3)
  const selectedVenue = venues.find((v) => v.id === selectedVenueId)

  const getFacilityIcon = (facility: string) => {
    switch (facility) {
      case 'parking':
        return <Car size={14} />
      case 'wifi':
        return <Wifi size={14} />
      case 'cafe':
        return <Coffee size={14} />
      case 'showers':
        return <Droplets size={14} />
      case 'equipment_rental':
        return <ShoppingBag size={14} />
      case 'changing_rooms':
        return <Building size={14} />
      default:
        return <Users size={14} />
    }
  }

  const getFacilityLabel = (facility: string) => {
    switch (facility) {
      case 'parking':
        return i18n._(msg`Parking`)
      case 'wifi':
        return i18n._(msg`WiFi`)
      case 'cafe':
        return i18n._(msg`Café`)
      case 'showers':
        return i18n._(msg`Showers`)
      case 'equipment_rental':
        return i18n._(msg`Equipment`)
      case 'changing_rooms':
        return i18n._(msg`Changing Rooms`)
      default:
        return facility
    }
  }

  const getVenueTypeColor = (type: string) => {
    switch (type) {
      case 'indoor':
        return 'bg-blue-100 text-blue-800'
      case 'outdoor':
        return 'bg-green-100 text-green-800'
      case 'mixed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Add Venue */}
      {!selectedVenueId && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={i18n._(msg`Search venues by name or location...`)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={onAddVenue}
            className="flex-shrink-0"
          >
            <Plus size={16} className="mr-2" />
            <Trans>Add New Venue</Trans>
          </Button>
        </div>
      )}

      {/* Selected Venue Display */}
      {selectedVenue && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {selectedVenue.name}
                  </h4>
                  <Badge variant="info" size="sm">
                    <Trans>Selected</Trans>
                  </Badge>
                  <Badge
                    variant="default"
                    size="sm"
                    className={getVenueTypeColor(selectedVenue.type)}
                  >
                    {selectedVenue.type}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin size={14} className="mr-1" />
                  {selectedVenue.address}, {selectedVenue.city}
                </div>
                {selectedVenue.rating && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Star
                      size={14}
                      className="mr-1 text-yellow-500 fill-current"
                    />
                    {selectedVenue.rating} ({selectedVenue.totalRatings}{' '}
                    reviews)
                  </div>
                )}
              </div>
              <button
                onClick={() => onVenueSelect('')}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                <X size={16} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue List */}
      {!selectedVenueId && (
        <div className="space-y-3">
          {displayedVenues.map((venue) => (
            <Card
              key={venue.id}
              className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50"
              onClick={() => onVenueSelect(venue.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Venue Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={venue.photos[0]}
                      alt={venue.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>

                  {/* Venue Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {venue.name}
                          </h3>
                          <Badge
                            variant="default"
                            size="sm"
                            className={getVenueTypeColor(venue.type)}
                          >
                            {venue.type}
                          </Badge>
                          {venue.isVerified && (
                            <Badge variant="success" size="sm">
                              <Check size={12} className="mr-1" />
                              <Trans>Verified</Trans>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin size={14} className="mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {venue.address}, {venue.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sports and Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {venue.sports.slice(0, 3).map((sportId) => {
                          const sport = SPORTS.find((s) => s.id === sportId)
                          return sport ? (
                            <span
                              key={sportId}
                              className="text-lg"
                              title={sport.name}
                            >
                              {sport.icon}
                            </span>
                          ) : null
                        })}
                        {venue.sports.length > 3 && (
                          <span className="text-sm text-gray-500">
                            +{venue.sports.length - 3}
                          </span>
                        )}
                      </div>

                      {venue.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Star
                            size={14}
                            className="mr-1 text-yellow-500 fill-current"
                          />
                          {venue.rating}
                        </div>
                      )}
                    </div>

                    {/* Facilities */}
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {venue.facilities.slice(0, 4).map((facility) => (
                        <div
                          key={facility}
                          className="flex items-center space-x-1"
                        >
                          {getFacilityIcon(facility)}
                          <span>{getFacilityLabel(facility)}</span>
                        </div>
                      ))}
                      {venue.facilities.length > 4 && (
                        <span><Trans>+{venue.facilities.length - 4} more</Trans></span>
                      )}
                    </div>

                    {/* Price Range */}
                    {venue.priceRange && venue.priceRange.max > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        €{venue.priceRange.min}
                        {venue.priceRange.min !== venue.priceRange.max &&
                          `-€${venue.priceRange.max}`}
                        <span className="text-gray-500"> <Trans>per hour</Trans></span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Show More/Less Button */}
          {venuesWithoutSelected.length > 3 && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllVenues(!showAllVenues)}
                className="w-full sm:w-auto"
              >
                {showAllVenues ? (
                  <Trans>Show Less</Trans>
                ) : (
                  <Trans>Show All {venuesWithoutSelected.length} Venues</Trans>
                )}
              </Button>
            </div>
          )}

          {/* No Results */}
          {filteredVenues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                <Trans>No venues found</Trans>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {(() => {
                  const sportName = sportFilter ? SPORTS.find((s) => s.id === sportFilter)?.name : undefined;

                  if (searchTerm) {
                    if (sportName) {
                      return t(i18n)`No venues match "{searchTerm}" for {sportName}`
                    } else {
                      return t(i18n)`No venues match "{searchTerm}"`
                    }
                  } else {
                    if (sportName) {
                      return t(i18n)`No venues available for {sportName}`
                    } else {
                      return t(i18n)`No venues available`
                    }
                  }
                })()}
              </p>
              <Button variant="primary" onClick={onAddVenue}>
                <Plus size={16} className="mr-2" />
                <Trans>Add the First Venue</Trans>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
