import React, { useEffect, useRef, useState } from 'react';
import { Event } from '../../types';
import { SPORTS } from '../../lib/constants';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Clock, Users, Euro, X } from 'lucide-react';
import { format } from 'date-fns';

interface EventMapProps {
  events: Event[];
  onEventSelect?: (event: Event) => void;
  onJoinEvent?: (eventId: string) => void;
}

interface MapMarker {
  event: Event;
  element: HTMLDivElement;
}

export const EventMap: React.FC<EventMapProps> = ({ events, onEventSelect, onJoinEvent }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<MapMarker[]>([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Prague center
          setUserLocation({ lat: 50.0755, lng: 14.4378 });
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      // Default to Prague center
      setUserLocation({ lat: 50.0755, lng: 14.4378 });
    }
  }, []);

  // Initialize map and markers
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker.element.parentNode) {
        marker.element.parentNode.removeChild(marker.element);
      }
    });
    markersRef.current = [];

    // Create map container with styling
    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';
    mapContainer.className = 'relative w-full h-full bg-gray-100 rounded-lg overflow-hidden';

    // Create a simple coordinate system for demo
    // In production, you'd use a real map library like Leaflet or Mapbox
    const mapWidth = mapContainer.offsetWidth;
    const mapHeight = mapContainer.offsetHeight;

    // Create background grid pattern
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'absolute inset-0');
    
    // Add grid pattern
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', 'grid');
    pattern.setAttribute('width', '40');
    pattern.setAttribute('height', '40');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 40 0 L 0 0 0 40');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#e5e7eb');
    path.setAttribute('stroke-width', '1');
    
    pattern.appendChild(path);
    defs.appendChild(pattern);
    svg.appendChild(defs);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'url(#grid)');
    svg.appendChild(rect);
    
    mapContainer.appendChild(svg);

    // Add user location marker
    const userMarker = document.createElement('div');
    userMarker.className = 'absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-20';
    userMarker.style.left = '50%';
    userMarker.style.top = '50%';
    mapContainer.appendChild(userMarker);

    // Add user location label
    const userLabel = document.createElement('div');
    userLabel.className = 'absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg transform -translate-x-1/2 z-20';
    userLabel.style.left = '50%';
    userLabel.style.top = 'calc(50% + 12px)';
    userLabel.textContent = 'You are here';
    mapContainer.appendChild(userLabel);

    // Add event markers
    events.forEach((event, index) => {
      const sport = SPORTS.find(s => s.id === event.sport);
      
      // Calculate position relative to user location (simplified)
      // In production, you'd use proper map projection
      const offsetX = (event.location.lng - userLocation.lng) * 1000; // Simplified scaling
      const offsetY = (userLocation.lat - event.location.lat) * 1000; // Simplified scaling
      
      const x = Math.max(40, Math.min(mapWidth - 40, mapWidth / 2 + offsetX));
      const y = Math.max(40, Math.min(mapHeight - 40, mapHeight / 2 + offsetY));

      // Create marker
      const marker = document.createElement('div');
      marker.className = 'absolute w-8 h-8 bg-white rounded-full border-2 border-primary-500 shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10';
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.style.transform = 'translate(-50%, -50%)';
      marker.innerHTML = `<span class="text-sm">${sport?.icon}</span>`;
      
      marker.addEventListener('click', () => {
        setSelectedEvent(event);
        onEventSelect?.(event);
      });

      mapContainer.appendChild(marker);
      markersRef.current.push({ event, element: marker });
    });

  }, [events, userLocation, onEventSelect]);

  const handleClosePopup = () => {
    setSelectedEvent(null);
  };

  const handleJoinEvent = () => {
    if (selectedEvent) {
      onJoinEvent?.(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />
      
      {/* Event Details Popup */}
      {selectedEvent && (
        <div className="absolute top-4 right-4 w-80 z-30">
          <Card className="shadow-xl">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">
                    {SPORTS.find(s => s.id === selectedEvent.sport)?.icon}
                  </span>
                  <h3 className="font-semibold text-gray-900">{selectedEvent.title}</h3>
                </div>
                <button
                  onClick={handleClosePopup}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{selectedEvent.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-2" />
                  {format(selectedEvent.date, 'EEEE, MMM d')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-2" />
                  {selectedEvent.startTime} ({selectedEvent.duration} min)
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={14} className="mr-2" />
                  {selectedEvent.participants.length}/{selectedEvent.maxParticipants} players
                </div>
                {selectedEvent.price && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Euro size={14} className="mr-2" />
                    €{selectedEvent.price} per person
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={
                  selectedEvent.participants.length < selectedEvent.maxParticipants ? 'success' : 'warning'
                }>
                  {selectedEvent.participants.length < selectedEvent.maxParticipants 
                    ? `${selectedEvent.maxParticipants - selectedEvent.participants.length} spots left`
                    : 'Waitlist'
                  }
                </Badge>
                <Button size="sm" onClick={handleJoinEvent}>
                  {selectedEvent.participants.length < selectedEvent.maxParticipants ? 'Join Game' : 'Join Waitlist'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
  );
};