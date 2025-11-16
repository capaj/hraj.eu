import React, { useEffect, useRef, useState } from 'react'

interface VenueMapPreviewProps {
  lat: number
  lng: number
  className?: string
}

export const VenueMapPreview: React.FC<VenueMapPreviewProps> = ({
  lat,
  lng,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return

      try {
        // Dynamically import Leaflet
        const L = await import('leaflet').then((m) => m.default || m)

        // Import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href =
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Clean up existing map if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Create the map
        const map = L.map(mapRef.current).setView([lat, lng], 15)

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map)

        // Create custom marker icon
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

        // Add marker
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

        mapInstanceRef.current = map
        markerRef.current = marker

        // Small delay to ensure map renders properly
        setTimeout(() => {
          map.invalidateSize()
          setIsLoading(false)
        }, 100)
      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
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
