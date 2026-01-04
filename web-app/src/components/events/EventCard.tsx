import React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Clock, MapPin, Users, Euro, Target } from 'lucide-react';
import { Event, User, Venue } from '../../types';
import { SPORTS } from '../../lib/constants';
import { format, isPast } from 'date-fns';
import { getEventDateTime } from '../../utils/eventDateTime';


interface EventCardProps {
  event: Event;
  venues?: Venue[];
  onJoin?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  isJoining?: boolean;
  currentUserId?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, venues, onJoin, onView, isJoining = false, currentUserId }) => {
  const isPastEvent = isPast(getEventDateTime(event));
  const isCancelled = event.status === 'cancelled';


  const sport = SPORTS.find(s => s.id === event.sport);
  const venue = venues?.find(v => v.id === event.venueId);
  const isSpotAvailable = event.participants.length < event.maxParticipants;
  const spotsLeft = event.maxParticipants - event.participants.length;
  const isIdealReached = event.idealParticipants && event.participants.length >= event.idealParticipants;
  const isMinimumReached = event.participants.length >= event.minParticipants;
  const isParticipant = currentUserId ? event.participants.includes(currentUserId) : false;
  const isWaitlisted = currentUserId ? event.waitlist?.includes(currentUserId) : false;

  const getParticipantStatus = () => {
    if (!isMinimumReached) {
      return {
        variant: 'error' as const,
        text: `Need ${event.minParticipants - event.participants.length} more to confirm`,
        icon: '⚠️'
      };
    } else if (isIdealReached) {
      return {
        variant: 'success' as const,
        text: isSpotAvailable ? `${spotsLeft} spots left` : 'Waitlist',
        icon: '✅'
      };
    } else {
      return {
        variant: 'warning' as const,
        text: `${event.idealParticipants! - event.participants.length} to ideal`,
        icon: '🎯'
      };
    }
  };

  const participantStatus = getParticipantStatus();

  return (
    <Card hover className="animate-fade-in h-full flex flex-col cursor-pointer" onClick={() => onView?.(event.id)}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="text-2xl flex-shrink-0">{sport?.icon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-lg truncate">{event.title}</h3>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Badge variant={participantStatus.variant} className="whitespace-nowrap">
              {participantStatus.icon} {participantStatus.text}
            </Badge>
          </div>
        </div>

        <p className="text-gray-700 mb-4 flex-grow">{event.description}</p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2" />
            {format(event.date, 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-2" />
            {event.startTime} ({event.duration} min)
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={16} className="mr-2" />
            {venue?.address || 'Location TBD'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-2" />
            <span>
              {event.participants.length}/{event.maxParticipants} players
              {event.idealParticipants && (
                <span className="text-gray-500 ml-1">(ideal: {event.idealParticipants})</span>
              )}
            </span>
          </div>
          {event.price && (
            <div className="flex items-center text-sm text-gray-600">
              {event.price} {event.currency} total for the venue
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 mt-auto">
          {!isPastEvent && !isCancelled && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.(event.id);
              }}
              className="flex-1"
              disabled={isJoining || isParticipant}
            >
              {isParticipant
                ? 'You are playing'
                : isWaitlisted
                  ? 'On Waitlist'
                  : isJoining
                    ? 'Joining...'
                    : isSpotAvailable
                      ? 'Join Game'
                      : 'Join Waitlist'}
            </Button>
          )}
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            onClick={(e) => e.stopPropagation()}
            className={isPastEvent || isCancelled ? 'flex-1' : ''}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};