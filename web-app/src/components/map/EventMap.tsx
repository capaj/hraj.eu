import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from 'react'
import 'leaflet/dist/leaflet.css'
import { Event, Venue } from '../../types'
import { SPORTS } from '../../lib/constants'
import { format } from 'date-fns'
import { authClient } from '../../lib/auth-client'

interface EventMapProps {
  events: Event[]
  venues: Venue[]
  onEventSelect?: (event: Event) => void
  onJoinEvent?: (eventId: string) => void
}

export interface EventMapRef {
  zoomToEvent: (eventId: string) => void
}

export const EventMap = forwardRef<EventMapRef, EventMapProps>(
  ({ events, venues, onEventSelect, onJoinEvent }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const eventMarkersRef = useRef<Map<string, any>>(new Map())
    const [mounted, setMounted] = useState(false)
    const [userLocation, setUserLocation] = useState<{
      lat: number
      lng: number
    } | null>(null)
    const session = authClient.useSession()
    const currentUserId = session.data?.user?.id

    const onEventSelectRef = useRef(onEventSelect)
    const onJoinEventRef = useRef(onJoinEvent)

    useImperativeHandle(
      ref,
      () => ({
        zoomToEvent: (eventId: string) => {
          const marker = eventMarkersRef.current.get(eventId)
          if (marker && mapInstanceRef.current) {
            const latLng = marker.getLatLng()
            mapInstanceRef.current.flyTo(latLng, 15, {
              duration: 2
            })
            setTimeout(() => {
              marker.openPopup()
            }, 2000)
          }
        }
      }),
      []
    )

    useEffect(() => {
      onJoinEventRef.current = onJoinEvent
    }, [onJoinEvent])

    useEffect(() => {
      onEventSelectRef.current = onEventSelect
    }, [onEventSelect])

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setMounted(true)
      }
    }, [])

    useEffect(() => {
      if (!mounted) return

      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          (error) => {
            console.error('Error getting location:', error)
            setUserLocation({ lat: 50.0755, lng: 14.4378 })
          },
          { timeout: 10000, enableHighAccuracy: false }
        )
      } else {
        setUserLocation({ lat: 50.0755, lng: 14.4378 })
      }
    }, [mounted])

    useEffect(() => {
      if (
        !mounted ||
        !mapRef.current ||
        !userLocation ||
        mapInstanceRef.current
      )
        return

      const initMap = async () => {
        const leafletModule = await import('leaflet')
        await import('leaflet/dist/leaflet.css')
        const L = leafletModule.default || leafletModule

        const map = L.map(mapRef.current!).setView(
          [userLocation.lat, userLocation.lng],
          13
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        mapInstanceRef.current = map
      }

      initMap()

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    }, [mounted, userLocation])

    useEffect(() => {
      if (!mounted || !mapInstanceRef.current) return

      const updateMarkers = async () => {
        const leafletModule = await import('leaflet')
        const L = leafletModule.default || leafletModule

        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []
        eventMarkersRef.current.clear()

        const bounds: [number, number][] = []
        if (userLocation) {
          bounds.push([userLocation.lat, userLocation.lng])
        }

        events.forEach((event) => {
          const sport = SPORTS.find((s) => s.id === event.sport)
          const venue = venues.find((v) => v.id === event.venueId)

          if (!venue || !mapInstanceRef.current) return

          bounds.push([venue.lat, venue.lng])

          const customIcon = L.divIcon({
            className: 'custom-event-marker',
            html: `<div style="width: 32px; height: 32px; background-color: white; border: 2px solid #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><span style="font-size: 16px;">${
              sport?.icon || '📍'
            }</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })

          const marker = L.marker([venue.lat, venue.lng], {
            icon: customIcon
          }).addTo(mapInstanceRef.current)

          const spotsLeft = event.maxParticipants - event.participants.length
          const isParticipating =
            currentUserId && event.participants.includes(currentUserId)
          const popupContent = `
        <div style="min-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">${sport?.icon || '📍'}</span>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${
                event.title
              }</h3>
            </div>
          </div>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563;">${
            event.description
          }</p>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; font-size: 14px; color: #4b5563;">
              <span style="margin-right: 8px;">📅</span>
              ${format(event.date, 'EEEE, MMM d')}
            </div>
            <div style="display: flex; align-items: center; font-size: 14px; color: #4b5563;">
              <span style="margin-right: 8px;">🕐</span>
              ${event.startTime} (${event.duration} min)
            </div>
            <div style="display: flex; align-items: center; font-size: 14px; color: #4b5563;">
              <span style="margin-right: 8px;">👥</span>
              ${event.participants.length}/${event.maxParticipants} players
            </div>
            ${
              event.price
                ? `
              <div style="display: flex; align-items: center; font-size: 14px; color: #4b5563;">
                <span style="margin-right: 8px;">💰</span>
                €${event.price} per person
              </div>
            `
                : ''
            }
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <span style="font-size: 12px; padding: 4px 8px; border-radius: 4px; background-color: ${
              isParticipating
                ? '#dbeafe'
                : spotsLeft > 0
                ? '#dcfce7'
                : '#fef3c7'
            }; color: ${
            isParticipating ? '#1e40af' : spotsLeft > 0 ? '#166534' : '#92400e'
          }; font-weight: 500;">
              ${
                isParticipating
                  ? 'You are playing'
                  : spotsLeft > 0
                  ? `${spotsLeft} spots left`
                  : 'Waitlist'
              }
            </span>
            <button 
              onclick="window.joinEvent_${event.id}()"
              style="padding: 8px 16px; background-color: ${
                isParticipating ? '#6b7280' : '#10b981'
              }; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: ${
            isParticipating ? 'default' : 'pointer'
          }; transition: background-color 0.2s;"
              onmouseover="${
                isParticipating ? '' : "this.style.backgroundColor='#059669'"
              }"
              onmouseout="${
                isParticipating ? '' : "this.style.backgroundColor='#10b981'"
              }"
              ${isParticipating ? 'disabled' : ''}
            >
              ${
                isParticipating
                  ? 'You are playing'
                  : spotsLeft > 0
                  ? 'Join Game'
                  : 'Join Waitlist'
              }
            </button>
          </div>
        </div>
      `

          if (typeof window !== 'undefined') {
            ;(window as any)[`joinEvent_${event.id}`] = () => {
              onJoinEventRef.current?.(event.id)
              marker.closePopup()
            }
          }

          marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'event-popup'
          })

          marker.on('click', () => {
            onEventSelectRef.current?.(event)
          })

          markersRef.current.push(marker)
          eventMarkersRef.current.set(event.id, marker)
        })

        if (bounds.length > 0 && mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }

      updateMarkers()
    }, [mounted, events, userLocation, currentUserId])

    if (!mounted) {
      return (
        <div className="relative w-full h-full">
          <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Loading map...</div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full h-full">
        <div ref={mapRef} className="w-full h-full min-h-[500px]" />

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-20">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Map Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Your location
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <div className="w-3 h-3 bg-white border-2 border-primary-500 rounded-full mr-2"></div>
              Sports events
            </div>
          </div>
        </div>
      </div>
    )
  }
)
