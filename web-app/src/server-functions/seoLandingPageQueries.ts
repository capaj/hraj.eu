import { and, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { eventT, participantT, venueT } from '../../drizzle/schema'
import { Event, Venue } from '../types'
import {
  getSportBySlug,
  getSportSlug,
  slugifyLandingSegment
} from '~/lib/seoLandingPages'
import type {
  SeoLandingPageData,
  SeoLandingPageLink
} from './getSeoLandingPageData'

type EventRow = typeof eventT.$inferSelect
type VenueRow = typeof venueT.$inferSelect

const PUBLIC_EVENT_STATUSES = ['open', 'confirmed'] as const

function mapVenue(venue: VenueRow): Venue {
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address || '',
    city: venue.city || '',
    country: venue.country || '',
    lat: venue.lat || 0,
    lng: venue.lng || 0,
    type: venue.type || 'outdoor',
    sports: venue.sports || [],
    facilities: venue.facilities || [],
    photos: venue.photos || [],
    orientationPlan: venue.orientationPlan || undefined,
    description: venue.description || undefined,
    accessInstructions: venue.accessInstructions || undefined,
    openingHours: undefined,
    price: venue.priceRangeMin || 0,
    currency: venue.priceRangeCurrency || 'CZK',
    contactInfo: {
      phone: venue.contactPhone || undefined,
      email: venue.contactEmail || undefined,
      website: venue.contactWebsite || undefined
    },
    rating: venue.rating || undefined,
    totalRatings: venue.totalRatings || undefined,
    createdBy: venue.createdBy || '',
    isVerified: venue.isVerified || false,
    createdAt: new Date(venue.createdAt),
    updatedAt: new Date(venue.updatedAt)
  }
}

async function mapEvent(event: EventRow): Promise<Event> {
  const participants = await db
    .select({
      userId: participantT.userId,
      status: participantT.status,
      plusAttendees: participantT.plusAttendees
    })
    .from(participantT)
    .where(eq(participantT.eventId, event.id))

  const confirmedParticipants = participants
    .filter((participant) => participant.status === 'confirmed')
    .map((participant) => participant.userId)

  const waitlistedParticipants = participants
    .filter((participant) => participant.status === 'waitlisted')
    .map((participant) => participant.userId)

  const participantPlusOnes = participants.reduce(
    (acc, participant) => {
      acc[participant.userId] = participant.plusAttendees || []
      return acc
    },
    {} as Record<string, string[]>
  )

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    sport: event.sport,
    venueId: event.venueId || '',
    date: new Date(event.date),
    startTime: event.startTime,
    duration: event.duration,
    minParticipants: event.minParticipants,
    idealParticipants: event.idealParticipants || undefined,
    maxParticipants: event.maxParticipants,
    cancellationDeadlineHours: event.cancellationDeadlineMinutes
      ? Math.floor(event.cancellationDeadlineMinutes / 60)
      : undefined,
    price: event.price || undefined,
    currency: event.currency || 'CZK',
    paymentDetails: event.paymentDetails || undefined,
    gameRules: event.gameRules || undefined,
    cutoffTime: new Date(
      new Date(event.date).getTime() -
        (event.cancellationDeadlineMinutes || 0) * 60 * 1000
    ),
    isPublic: event.isPublic,
    organizerId: event.organizerId,
    participants: confirmedParticipants,
    waitlist: waitlistedParticipants,
    participantPlusOnes,
    status: event.status as Event['status'],
    allowedSkillLevels: event.requiredSkillLevel
      ? [event.requiredSkillLevel]
      : undefined,
    requireSkillLevel: !!event.requiredSkillLevel,
    qrCodeImages: event.qrCodeImages || [],
    coreGroupId: event.coreGroupId || undefined,
    coreGroupExclusiveUntil: event.coreGroupExclusiveUntil
      ? new Date(event.coreGroupExclusiveUntil)
      : undefined,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt)
  }
}

async function getPublicUpcomingEvents() {
  const eventDateTimeSql = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime})`

  return db
    .select()
    .from(eventT)
    .where(
      and(
        eq(eventT.isPublic, true),
        inArray(eventT.status, PUBLIC_EVENT_STATUSES),
        sql`${eventDateTimeSql} >= datetime('now')`,
        or(
          isNull(eventT.coreGroupExclusiveUntil),
          lte(eventT.coreGroupExclusiveUntil, new Date())
        )
      )
    )
    .orderBy(eventDateTimeSql)
}

async function getLandingInventory() {
  const [venuesFromDb, eventsFromDb] = await Promise.all([
    db.select().from(venueT),
    getPublicUpcomingEvents()
  ])

  const venues = venuesFromDb.map(mapVenue)
  const venueById = new Map(venues.map((venue) => [venue.id, venue]))

  const events = await Promise.all(eventsFromDb.map(mapEvent))
  const publicEvents = events.filter((event) => {
    const venue = venueById.get(event.venueId)
    return !!venue?.city
  })

  return { venues, venueById, events: publicEvents }
}

function getCityCountry(venues: Venue[]) {
  return venues.find((venue) => venue.country)?.country
}

export async function querySeoLandingPageLinks(): Promise<SeoLandingPageLink[]> {
  const { venues, venueById, events } = await getLandingInventory()
  const links = new Map<string, SeoLandingPageLink>()

  for (const venue of venues) {
    if (!venue.city) continue

    const citySlug = slugifyLandingSegment(venue.city)
    const cityKey = `city:${citySlug}`
    const cityLink = links.get(cityKey) || {
      city: venue.city,
      citySlug,
      country: venue.country || undefined,
      eventCount: 0,
      venueCount: 0
    }
    cityLink.venueCount += 1
    links.set(cityKey, cityLink)

    if (!venue.isVerified) continue

    for (const sportId of venue.sports) {
      const sport = getSportBySlug(getSportSlug(sportId))
      if (!sport) continue

      const sportSlug = getSportSlug(sport.id)
      const sportKey = `sport:${citySlug}:${sportSlug}`
      const sportLink = links.get(sportKey) || {
        city: venue.city,
        citySlug,
        country: venue.country || undefined,
        sportId: sport.id,
        sportName: sport.name,
        sportSlug,
        eventCount: 0,
        venueCount: 0
      }
      sportLink.venueCount += 1
      links.set(sportKey, sportLink)
    }
  }

  for (const event of events) {
    const venue = venueById.get(event.venueId)
    if (!venue?.city) continue

    const citySlug = slugifyLandingSegment(venue.city)
    const cityKey = `city:${citySlug}`
    const cityLink = links.get(cityKey) || {
      city: venue.city,
      citySlug,
      country: venue.country || undefined,
      eventCount: 0,
      venueCount: 0
    }
    cityLink.eventCount += 1
    links.set(cityKey, cityLink)

    const sport = getSportBySlug(getSportSlug(event.sport))
    if (!sport) continue

    const sportSlug = getSportSlug(sport.id)
    const sportKey = `sport:${citySlug}:${sportSlug}`
    const sportLink = links.get(sportKey) || {
      city: venue.city,
      citySlug,
      country: venue.country || undefined,
      sportId: sport.id,
      sportName: sport.name,
      sportSlug,
      eventCount: 0,
      venueCount: 0
    }
    sportLink.eventCount += 1
    links.set(sportKey, sportLink)
  }

  return [...links.values()].filter(
    (link) => link.eventCount > 0 || link.venueCount > 0
  )
}

export async function querySeoLandingPageData({
  citySlug,
  sportSlug
}: {
  citySlug: string
  sportSlug?: string
}): Promise<SeoLandingPageData | null> {
  const sport = sportSlug ? getSportBySlug(sportSlug) : undefined
  if (sportSlug && !sport) return null

  const { venues, venueById, events } = await getLandingInventory()
  const cityVenues = venues.filter(
    (venue) => slugifyLandingSegment(venue.city) === citySlug
  )

  const cityEvents = events.filter((event) => {
    const venue = venueById.get(event.venueId)
    return venue && slugifyLandingSegment(venue.city) === citySlug
  })

  if (cityVenues.length === 0 && cityEvents.length === 0) return null

  const filteredVenues = sport
    ? cityVenues.filter((venue) => venue.sports.includes(sport.id))
    : cityVenues
  const filteredEvents = sport
    ? cityEvents.filter((event) => event.sport === sport.id)
    : cityEvents

  if (filteredVenues.length === 0 && filteredEvents.length === 0) return null

  const city = cityVenues[0]?.city || venueById.get(cityEvents[0]?.venueId || '')?.city
  if (!city) return null

  const allLinks = await querySeoLandingPageLinks()
  const cityLinks = allLinks
    .filter((link) => !link.sportId)
    .sort((a, b) => b.eventCount - a.eventCount || a.city.localeCompare(b.city))
    .slice(0, 24)
  const sportLinks = allLinks
    .filter((link) => link.citySlug === citySlug && link.sportId)
    .sort((a, b) => b.eventCount - a.eventCount || a.sportName!.localeCompare(b.sportName!))

  return {
    city,
    citySlug,
    country: getCityCountry(cityVenues),
    sportId: sport?.id,
    sportName: sport?.name,
    sportSlug: sport ? getSportSlug(sport.id) : undefined,
    events: filteredEvents,
    venues: filteredVenues,
    cityLinks,
    sportLinks
  }
}
