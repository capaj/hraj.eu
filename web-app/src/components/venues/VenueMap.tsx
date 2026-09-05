import { useEffect, useRef, useState } from 'react'
import { Trans } from '@lingui/react/macro'
import 'leaflet/dist/leaflet.css'
import type { Venue } from '../../types'

type VenueMapProps = {
  venues: Venue[]
  selectedVenueId?: string
  onVenueSelect?: (venueId: string) => void
}

const DEFAULT_CENTER: [number, number] = [50.0755, 14.4378]

function hasMapLocation(venue: Venue) {
  return (
    Number.isFinite(venue.lat) &&
    Number.isFinite(venue.lng) &&
    (venue.lat !== 0 || venue.lng !== 0)
  )
}

export function VenueMap({
  venues,
  selectedVenueId,
  onVenueSelect
}: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const onVenueSelectRef = useRef(onVenueSelect)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    onVenueSelectRef.current = onVenueSelect
  }, [onVenueSelect])

  useEffect(() => {
    let isMounted = true

    const initializeMap = async () => {
      if (!containerRef.current || mapRef.current) return

      try {
        const leafletModule = await import('leaflet')
        const L = leafletModule.default || leafletModule

        if (!isMounted || !containerRef.current) return

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false
        }).setView(DEFAULT_CENTER, 7)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map)

        mapRef.current = map
        setIsReady(true)

        window.setTimeout(() => map.invalidateSize(), 0)
      } catch (mapError) {
        console.error('Failed to initialize venue map:', mapError)
        if (isMounted) setError(true)
      }
    }

    void initializeMap()

    return () => {
      isMounted = false
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isReady || !mapRef.current) return

    const renderMarkers = async () => {
      const leafletModule = await import('leaflet')
      const L = leafletModule.default || leafletModule
      const map = mapRef.current

      if (!map) return

      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      const bounds: [number, number][] = []

      for (const venue of venues.filter(hasMapLocation)) {
        const isSelected = venue.id === selectedVenueId
        const color = isSelected ? '#0f766e' : '#16a34a'
        const icon = L.divIcon({
          className: 'venue-map-marker',
          html: `<div style="width:36px;height:36px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 3px 10px rgba(15,23,42,.3);display:flex;align-items:center;justify-content:center;color:white;transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:transform .2s ease"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -38]
        })

        const marker = L.marker([venue.lat, venue.lng], {
          icon,
          title: venue.name,
          alt: venue.name
        }).addTo(map)
        const popup = document.createElement('div')
        popup.className = 'min-w-48 font-sans'

        const title = document.createElement('strong')
        title.className = 'block text-sm text-gray-900'
        title.textContent = venue.name
        popup.appendChild(title)

        const location = [venue.address, venue.city].filter(Boolean).join(', ')
        if (location) {
          const address = document.createElement('span')
          address.className = 'mt-1 block text-xs text-gray-600'
          address.textContent = location
          popup.appendChild(address)
        }

        marker.bindPopup(popup)
        marker.on('click', () => onVenueSelectRef.current?.(venue.id))

        markersRef.current.push(marker)
        bounds.push([venue.lat, venue.lng])

        if (isSelected) marker.openPopup()
      }

      if (bounds.length === 0) {
        map.setView(DEFAULT_CENTER, 7)
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14)
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }

      window.setTimeout(() => map.invalidateSize(), 0)
    }

    void renderMarkers()
  }, [isReady, selectedVenueId, venues])

  if (error) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-gray-100 text-sm text-gray-600">
        <Trans>The venue map could not be loaded.</Trans>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[360px]">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 text-sm text-gray-600">
          <Trans>Loading map…</Trans>
        </div>
      )}
      <div ref={containerRef} className="h-full min-h-[360px] w-full" />
    </div>
  )
}
