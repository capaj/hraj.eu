import React, { useEffect, useRef, useState } from 'react'
import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let isGoogleMapsConfigured = false

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
  placeholder,
  className = '',
  required = false,
  apiKey
}) => {
  const defaultPlaceholder = i18n._(msg`Enter address`)
  const finalPlaceholder = placeholder || defaultPlaceholder
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const onChangeRef = useRef(onChange)
  const onPlaceSelectedRef = useRef(onPlaceSelected)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected
  }, [onPlaceSelected])

  useEffect(() => {
    let isMounted = true

    const loadGoogleMaps = async () => {
      if (!apiKey) {
        console.warn('Google Maps API key not provided')
        return
      }

      if (!isGoogleMapsConfigured) {
        setOptions({
          key: apiKey,
          v: 'weekly'
        })

        isGoogleMapsConfigured = true
      }

      await importLibrary('places')

      if (isMounted) {
        setIsLoaded(true)
      }
    }

    loadGoogleMaps()

    return () => {
      isMounted = false
    }
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
    const listener = autocompleteRef.current!.addListener(
      'place_changed',
      () => {
        const place = autocompleteRef.current?.getPlace()

        if (!place || !place.geometry || !place.geometry.location) {
          console.warn('No place details available')
          return
        }

        // Extract address components
        let street = ''
        let city = ''
        let country = ''

        place.address_components?.forEach(
          (component: { long_name: string; types: string[] }) => {
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
          }
        )

        // Use formatted_address if street is empty
        const finalAddress =
          street || place.formatted_address || place.name || ''

        const details: AddressDetails = {
          address: finalAddress,
          city: city,
          country: country,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }

        onChangeRef.current(finalAddress)
        onPlaceSelectedRef.current(details)
      }
    )

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener)
      }
    }
  }, [isLoaded])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={finalPlaceholder}
      className={className}
      required={required}
      autoComplete="off"
    />
  )
}
