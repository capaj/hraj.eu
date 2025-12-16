import React, { useEffect, useRef, useState } from 'react'

interface VenueMapPreviewProps {
  lat: number
  lng: number
  className?: string
  onLocationChange?: (lat: number, lng: number) => void
}

export const VenueMapPreview: React.FC<VenueMapPreviewProps> = ({
  lat,
  lng,
  className = '',
  onLocationChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use a ref to store the latest onLocationChange callback
  const onLocationChangeRef = useRef(onLocationChange)
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange

    // Update dragging capability if callback availability changes
    if (markerRef.current) {
      if (onLocationChange) {
        markerRef.current.dragging?.enable()
      } else {
        markerRef.current.dragging?.disable()
      }
    }
  }, [onLocationChange])

  // Initialize Map
  useEffect(() => {
    let isMounted = true
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      try {
        const L = await import('leaflet').then((m) => m.default || m)

        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        const map = L.map(mapRef.current).setView([lat, lng], 15)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map)

        const customIcon = L.divIcon({
          className: 'custom-venue-marker',
          html: `<div style="
            background-color: #4F46E5;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="font-size: 16px;">📍</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })

        const marker = L.marker([lat, lng], {
          icon: customIcon,
          draggable: !!onLocationChangeRef.current
        }).addTo(map)

        mapInstanceRef.current = map
        markerRef.current = marker

        marker.on('dragend', (event: any) => {
          const position = event.target.getLatLng()
          if (onLocationChangeRef.current) {
            onLocationChangeRef.current(position.lat, position.lng)
          }
        })

        map.on('click', (e: any) => {
          if (onLocationChangeRef.current) {
            const { lat, lng } = e.latlng
            marker.setLatLng([lat, lng])
            onLocationChangeRef.current(lat, lng)
          }
        })

        setTimeout(() => {
          if (isMounted) {
            map.invalidateSize()
            setIsLoading(false)
          }
        }, 100)
      } catch (err) {
        console.error('Error initializing map:', err)
        if (isMounted) setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, []) // Initialize only once

  // Update Map Position
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const map = mapInstanceRef.current
      const marker = markerRef.current
      const currentLatLng = marker.getLatLng()

      // Only update if significantly different
      const epsilon = 0.000001
      if (Math.abs(currentLatLng.lat - lat) > epsilon || Math.abs(currentLatLng.lng - lng) > epsilon) {
        marker.setLatLng([lat, lng])
        map.setView([lat, lng], map.getZoom())
      }
    }
  }, [lat, lng])

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      >
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10 ${className}`}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      <div ref={mapRef} className={`rounded-lg ${className}`} />
    </div>
  )
}
