import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'
import { Venue } from '../types'
import { db } from '../../drizzle/db'
import { venueT, user } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'

const ADMIN_EMAILS = ['capajj@gmail.com']

export const getVenuesForCurrentUser = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage venues')
    }

    const userId = session.user.id

    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        email: true
      }
    })

    const isAdmin = userData?.email && ADMIN_EMAILS.includes(userData.email)

    const venuesFromDb = isAdmin
      ? await db.select().from(venueT)
      : await db
          .select()
          .from(venueT)
          .where(eq(venueT.createdBy, userId))

    const venues = venuesFromDb.map((venue) => {
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
        createdAt: new Date(venue.createdAt),
        updatedAt: new Date(venue.updatedAt)
      } 
    })

    return venues
  })
