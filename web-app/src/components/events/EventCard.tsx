import React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Clock, MapPin, Users, Euro, Target, BadgeDollarSign } from 'lucide-react';
import { Event, User, Venue } from '../../types';
import { SPORTS } from '../../lib/constants';
import { format, isPast, differenceInCalendarDays } from 'date-fns';
import { enUS, cs } from 'date-fns/locale';
import { getEventDateTime } from '../../utils/eventDateTime';
import { t, plural } from "@lingui/core/macro";
import { i18n } from '../../lib/i18n';
import { getConfirmedHeadcount } from '../../utils/participants';


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
  const dateLocale = i18n.locale === 'cs' ? cs : enUS;


  const sport = SPORTS.find(s => s.id === event.sport);
  const venue = venues?.find(v => v.id === event.venueId);
  const confirmedHeadcount = getConfirmedHeadcount(event);
  const isSpotAvailable = confirmedHeadcount < event.maxParticipants;
  const spotsLeft = event.maxParticipants - confirmedHeadcount;
  const isIdealReached = event.idealParticipants && confirmedHeadcount >= event.idealParticipants;
  const isMinimumReached = confirmedHeadcount >= event.minParticipants;
  const isBelowMinimum = confirmedHeadcount < event.minParticipants;
  const isParticipant = currentUserId ? event.participants.includes(currentUserId) : false;
  const isWaitlisted = currentUserId ? event.waitlist?.includes(currentUserId) : false;

  const getParticipantStatus = () => {
    if (!isMinimumReached) {
      return {
        variant: 'error' as const,
        text: `Need ${event.minParticipants - confirmedHeadcount} more to confirm`,
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
        text: `${event.idealParticipants! - confirmedHeadcount} to ideal`,
        icon: '🎯'
      };
    }
  };

  const participantStatus = getParticipantStatus();

  const getJoinButtonText = () => {
    if (isParticipant && isBelowMinimum) return 'You would like to participate';
    if (isParticipant) return 'You are playing';
    if (isWaitlisted) return 'On Waitlist';
    if (isJoining) return 'Joining...';
    if (isSpotAvailable) return 'Join Game';
    return 'Join Waitlist';
  };

  return (
    <Card hover className="animate-fade-in h-full flex flex-col cursor-pointer" onClick={() => onView?.(event.id)}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="text-2xl flex-shrink-0">{sport?.icon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {event.title}
                <span className="text-gray-500 font-normal ml-2">
                  {format(event.date, 'd.M.', { locale: dateLocale })}
                </span>
              </h3>
            </div>
          </div>

        </div>

        <p className="text-gray-700 mb-4 flex-grow">{event.description}</p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2" />
            {(() => {
              const daysLeft = differenceInCalendarDays(event.date, new Date());
              if (daysLeft > 0) {
                const label = plural(daysLeft, {
                  one: 'in # day',
                  few: 'in # days',
                  many: 'in # days',
                  other: 'in # days',
                });
                return (
                  <span className="mr-2 font-medium text-gray-800">{label}</span>
                );
              }
              if (daysLeft === 0) {
                return <span className="mr-2 font-medium text-gray-800">{t`today`}</span>;
              }
              return null;
            })()}
            {format(event.date, 'PPPP', { locale: dateLocale })}
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
              {confirmedHeadcount}/{event.maxParticipants} players
              {event.idealParticipants && (
                <span className="text-gray-500 ml-1">(ideal: {event.idealParticipants})</span>
              )}
            </span>
            {!isPastEvent && (
              <Badge variant={participantStatus.variant} className="whitespace-nowrap ml-2">
                {participantStatus.icon} {participantStatus.text}
              </Badge>
            )}
          </div>
          {event.price && (
            <div className="flex items-center text-sm text-gray-600">
              <BadgeDollarSign size={16} className="mr-2" />
              {Math.ceil(event.price / (event.idealParticipants || event.maxParticipants))} {event.currency || 'CZK'} {t`per person`}
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
              {getJoinButtonText()}
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