import { msg } from '@lingui/core/macro'
import type { I18n } from '@lingui/core'
import { i18n } from './i18n'

const sportNames = {
  soccer: msg`Soccer`,
  futsal: msg`Futsal`,
  basketball: msg`Basketball`,
  volleyball: msg`Volleyball`,
  'beach-volleyball': msg`Beach Volleyball`,
  'football-tennis': msg`Football Tennis`,
  handball: msg`Handball`,
  'rugby-union': msg`Rugby Union`,
  'rugby-league': msg`Rugby League`,
  'ice-hockey': msg`Ice Hockey`,
  'field-hockey': msg`Field Hockey`,
  'water-polo': msg`Water Polo`,
  cricket: msg`Cricket`,
  netball: msg`Netball`,
  korfball: msg`Korfball`,
  floorball: msg`Floorball`
}

const skillLevelNames = {
  beginner: msg`Beginner`,
  intermediate: msg`Intermediate`,
  advanced: msg`Advanced`
}

const facilityNames = {
  parking: msg`Parking`,
  restrooms: msg`Restrooms`,
  food: msg`Café/Restaurant`,
  cafe: msg`Café`,
  lounge: msg`Lounge`,
  wifi: msg`WiFi`,
  locker_room: msg`Locker Room`,
  shower: msg`Showers`,
  showers: msg`Showers`,
  dressing_room: msg`Changing Rooms`,
  changing_rooms: msg`Changing Rooms`,
  equipment_rental: msg`Equipment`
}

const venueTypeNames = {
  indoor: msg`Indoor`,
  outdoor: msg`Outdoor`,
  mixed: msg`Mixed`
}

const eventStatusNames = {
  draft: msg`Draft`,
  open: msg`Open`,
  confirmed: msg`Confirmed`,
  cancelled: msg`Cancelled`,
  completed: msg`Completed`
}

export function getSportName(id: string, translator: I18n = i18n) {
  if (!Object.hasOwn(sportNames, id)) return id
  const message = sportNames[id as keyof typeof sportNames]
  return message ? translator._(message) : id
}

export function getSkillLevelName(id: string) {
  if (!Object.hasOwn(skillLevelNames, id)) return id
  const message = skillLevelNames[id as keyof typeof skillLevelNames]
  return message ? i18n._(message) : id
}

export function getFacilityName(id: string) {
  if (!Object.hasOwn(facilityNames, id)) return id
  const message = facilityNames[id as keyof typeof facilityNames]
  return message ? i18n._(message) : id
}

export function getVenueTypeName(id: string) {
  if (!Object.hasOwn(venueTypeNames, id)) return id
  const message = venueTypeNames[id as keyof typeof venueTypeNames]
  return message ? i18n._(message) : id
}

export function getEventStatusName(id: string) {
  if (!Object.hasOwn(eventStatusNames, id)) return id
  const message = eventStatusNames[id as keyof typeof eventStatusNames]
  return message ? i18n._(message) : id
}

export function getCancellationReason(reason: string) {
  return reason === 'Minimum participants not reached'
    ? i18n._(msg`Minimum participants not reached`)
    : reason
}
