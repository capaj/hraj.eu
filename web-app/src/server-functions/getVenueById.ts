import { createServerFn } from '@tanstack/react-start'
import { Venue } from '../types'
import { db } from '../../drizzle/db'
import { venueT } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

export const getVenueById = createServerFn({ method: 'GET' })
  .inputValidator((venueId: string) => venueId)
  .handler(async ({ data: venueId }) => {
    const venues = await db
      .select()
      .from(venueT)
      .where(eq(venueT.id, venueId))
      .limit(1)

    if (!venues || venues.length === 0) {
      throw new Error(`Venue with id ${venueId} not found`)
    }

    const venue = venues[0]

    return {
      id: venue.id,
      name: venue.name,
      address: venue.address || '',
      city: venue.city || '',
      country: venue.country || '',
      lat: venue.lat || 0,
      lng: venue.lng || 0,
      type: venue.type || 'outdoor',
      sports: (venue.sports as string[]) || [],
      facilities: (venue.facilities as string[]) || [],
      images: (venue.photos as string[]) || [],
      orientationPlan: venue.orientationPlan || undefined,
      description: venue.description || undefined,
      accessInstructions: venue.accessInstructions || undefined,
      openingHours: venue.openingHours
        ? (Array.isArray(venue.openingHours)
            ? (
                venue.openingHours as {
                  day: string
                  open: string
                  close: string
                }[]
              ).reduce((acc, item) => {
                acc[item.day] = { open: item.open, close: item.close }
                return acc
              }, {} as { [key: string]: { open: string; close: string } })
            : (venue.openingHours as Venue['openingHours'])) || undefined
        : undefined,
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
      createdAt: new Date(),
      updatedAt: new Date()
    } as Venue
  })
