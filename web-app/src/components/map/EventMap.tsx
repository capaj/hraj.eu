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
import dayjs from 'dayjs'
import { t } from "@lingui/core/macro";

interface EventMapProps {
  events: Event[]
  venues: Venue[]
  onEventSelect?: (event: Event) => void
  onJoinEvent?: (eventId: string) => void
  currentUserId?: string
}

export interface EventMapRef {
  zoomToEvent: (eventId: string) => void
}

export const EventMap = forwardRef<EventMapRef, EventMapProps>(
  ({ events, venues, onEventSelect, onJoinEvent, currentUserId }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const eventMarkersRef = useRef<Map<string, any>>(new Map())
    const hasFittedBoundsRef = useRef(false)
    const [isMapReady, setIsMapReady] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [userLocation, setUserLocation] = useState<{
      lat: number
      lng: number
    } | null>(null)

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
        setIsMapReady(true)
      }

      initMap()

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          setIsMapReady(false)
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

        const oldestVisibleTime = dayjs().subtract(12, 'hour')
        const visibleEvents = events.filter((event) => {
          const eventStartTime = dayjs(event.date)
          const [hours = 0, minutes = 0] = event.startTime
            .split(':')
            .map(Number)
          const normalizedStartTime = eventStartTime
            .hour(hours)
            .minute(minutes)
            .second(0)
            .millisecond(0)
          const eventEndTime = normalizedStartTime.add(event.duration, 'minute')

          return eventEndTime.valueOf() >= oldestVisibleTime.valueOf()
        })

        const eventsByVenue = new Map<string, Event[]>()
        visibleEvents.forEach((event) => {
          if (!event.venueId) return
          if (!eventsByVenue.has(event.venueId)) {
            eventsByVenue.set(event.venueId, [])
          }
          eventsByVenue.get(event.venueId)!.push(event)
        })

        eventsByVenue.forEach((venueEvents, venueId) => {
          const venue = venues.find((v) => v.id === venueId)

          if (!venue || !mapInstanceRef.current) return

          bounds.push([venue.lat, venue.lng])

          const mainSport = SPORTS.find((s) => s.id === venueEvents[0].sport)

          const countBadge =
            venueEvents.length > 1
              ? `<div style="position: absolute; top: -6px; right: -6px; background-color: #ef4444; color: white; border-radius: 9999px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); z-index: 10;">${venueEvents.length}</div>`
              : ''

          const customIcon = L.divIcon({
            className: 'custom-event-marker',
            html: `<div style="position: relative; width: 32px; height: 32px; background-color: white; border: 2px solid #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><span style="font-size: 16px;">${mainSport?.icon || '📍'
              }</span>${countBadge}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })

          const marker = L.marker([venue.lat, venue.lng], {
            icon: customIcon
          }).addTo(mapInstanceRef.current)

          let popupContent = `<div style="min-width: 280px; font-family: system-ui, -apple-system, sans-serif;">`

          if (venueEvents.length > 1) {
            popupContent += `
               <div style="padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px;">
                 <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151;">
                   ${venueEvents.length} events at ${venue.name}
                 </h3>
               </div>
               <div style="max-height: 320px; overflow-y: auto; padding-right: 4px;">
             `
          }

          venueEvents.forEach((event, index) => {
            const sport = SPORTS.find((s) => s.id === event.sport)
            const isJoined =
              currentUserId && event.participants.includes(currentUserId)
            const spotsLeft = event.maxParticipants - event.participants.length

            const eventHtml = `
              <div style="${index > 0
                ? 'padding-top: 12px; border-top: 1px dashed #e5e7eb; margin-top: 12px;'
                : ''
              }">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${sport?.icon || '📍'}</span>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${event.title
              }</h3>
                  </div>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">${event.description
              }</p>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
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
                  ${event.price
                ? `
                    <div style="display: flex; align-items: center; font-size: 14px; color: #4b5563;">
                      <span style="margin-right: 8px;">💰</span>
                      €${event.price} ${t`per person`}
                    </div>
                  `
                : ''
              }
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                  <span style="font-size: 12px; padding: 4px 8px; border-radius: 4px; background-color: ${spotsLeft > 0 ? '#dcfce7' : '#fef3c7'
              }; color: ${spotsLeft > 0 ? '#166534' : '#92400e'
              }; font-weight: 500;">
                    ${spotsLeft > 0 ? `${spotsLeft} spots left` : t`Waitlist`}
                  </span>
                  ${isJoined
                ? `<button 
                        style="padding: 6px 12px; background-color: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: default;"
                      >
                        ${t`You are playing`}
                      </button>`
                : `<button 
                        onclick="window.joinEvent_${event.id}()"
                        style="padding: 6px 12px; background-color: #10b981; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#059669'"
                        onmouseout="this.style.backgroundColor='#10b981'"
                      >
                        ${spotsLeft > 0 ? t`Join Game` : t`Join Waitlist`}
                      </button>`
              } 
                </div>
              </div>
            `
            popupContent += eventHtml

            if (typeof window !== 'undefined') {
              ; (window as any)[`joinEvent_${event.id}`] = () => {
                onJoinEventRef.current?.(event.id)
                marker.closePopup()
              }
            }

            eventMarkersRef.current.set(event.id, marker)
          })

          if (venueEvents.length > 1) {
            popupContent += `</div>`
          }
          popupContent += `</div>`

          marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'event-popup'
          })

          marker.on('click', () => {
            if (venueEvents.length === 1) {
              onEventSelectRef.current?.(venueEvents[0])
            }
          })

          markersRef.current.push(marker)
        })

        if (
          bounds.length > 0 &&
          mapInstanceRef.current &&
          !hasFittedBoundsRef.current
        ) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
          hasFittedBoundsRef.current = true
        }
      }

      updateMarkers()
    }, [mounted, events, userLocation, isMapReady, currentUserId])

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
