import React, { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

export interface AddressDetails {
  address: string
  city: string
  country: string
  lat: number
  lng: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelected: (details: AddressDetails) => void
  placeholder?: string
  className?: string
  required?: boolean
  apiKey: string
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = 'Enter address',
  className = '',
  required = false,
  apiKey
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API key not provided')
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    })

    loader
      .load()
      .then(() => {
        setIsLoaded(true)
      })
      .catch((error) => {
        console.error('Error loading Google Maps API:', error)
      })
  }, [apiKey])

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) {
      return
    }

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'name']
      }
    )

    // Add listener for place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()

      if (!place || !place.geometry || !place.geometry.location) {
        console.warn('No place details available')
        return
      }

      // Extract address components
      let street = ''
      let city = ''
      let country = ''

      place.address_components?.forEach((component) => {
        const types = component.types

        if (types.includes('route')) {
          street = component.long_name
        } else if (types.includes('street_number')) {
          street = `${component.long_name} ${street}`.trim()
        } else if (
          types.includes('locality') ||
          types.includes('postal_town')
        ) {
          city = component.long_name
        } else if (types.includes('country')) {
          country = component.long_name
        }
      })

      // Use formatted_address if street is empty
      const finalAddress = street || place.formatted_address || place.name || ''

      const details: AddressDetails = {
        address: finalAddress,
        city: city,
        country: country,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }

      onChange(finalAddress)
      onPlaceSelected(details)
    })

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener)
      }
    }
  }, [isLoaded, onChange, onPlaceSelected])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      required={required}
    />
  )
}
