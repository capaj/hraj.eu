import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from 'drizzle/db'
import { venueT } from '../../drizzle/schema'
import { mockEvents, mockUsers, mockNotifications } from './mock-data'
import { Event, User, Notification, Venue } from '../types'
import { getBindings } from '~/utils/getBindings'

// TODO: Replace with Turso database calls
export const getEvents = createServerFn({ method: 'GET' }).handler(async () => {
  // Simulate some async processing (future database call)
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Future: Replace with Turso query
  // const events = await db.select().from(eventsTable)
  return mockEvents as Event[]
})

export const getEventById = createServerFn({ method: 'GET' })
  .validator((eventId: string) => eventId)
  .handler(async ({ data: eventId }) => {
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Future: Replace with Turso query
    // const event = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1)
    const event = mockEvents.find((e) => e.id === eventId)

    if (!event) {
      throw new Error(`Event with id ${eventId} not found`)
    }

    return event as Event
  })

export const getUpcomingEvents = createServerFn({ method: 'GET' })
  .validator((limit?: number) => limit || 3)
  .handler(async ({ data: limit }) => {
    await new Promise((resolve) => setTimeout(resolve, 80))

    // Future: Replace with Turso query with date filtering and limit
    // const events = await db.select().from(eventsTable)
    //   .where(gte(eventsTable.date, new Date()))
    //   .orderBy(asc(eventsTable.date))
    //   .limit(limit)

    const now = new Date()
    const upcomingEvents = mockEvents
      .filter((event) => event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit)

    return upcomingEvents as Event[]
  })

export const getEventsByFilters = createServerFn({ method: 'GET' })
  .validator(
    (filters: { sport?: string; skillLevel?: string; location?: string }) =>
      filters
  )
  .handler(async ({ data: filters }) => {
    await new Promise((resolve) => setTimeout(resolve, 120))

    // Future: Replace with complex Turso query with joins and filtering
    // const events = await db.select().from(eventsTable)
    //   .leftJoin(venuesTable, eq(eventsTable.venueId, venuesTable.id))
    //   .where(/* complex where clause based on filters */)

    let filteredEvents = [...mockEvents]

    if (filters.sport) {
      filteredEvents = filteredEvents.filter(
        (event) => event.sport === filters.sport
      )
    }

    // Additional filtering logic can be added here

    return filteredEvents as Event[]
  })

export const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await new Promise((resolve) => setTimeout(resolve, 70))

  // Future: Replace with Turso query
  // const users = await db.select().from(usersTable)
  return mockUsers as User[]
})

export const getUserById = createServerFn({ method: 'GET' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    await new Promise((resolve) => setTimeout(resolve, 60))

    // Future: Replace with Turso query
    // const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1)
    const user = mockUsers.find((u) => u.id === userId)

    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    return user as User
  })

export const getUserNotifications = createServerFn({ method: 'GET' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    await new Promise((resolve) => setTimeout(resolve, 90))

    // Future: Replace with Turso query
    // const notifications = await db.select().from(notificationsTable)
    //   .where(eq(notificationsTable.userId, userId))
    //   .orderBy(desc(notificationsTable.createdAt))

    const userNotifications = mockNotifications
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return userNotifications as Notification[]
  })

export const getVenues = createServerFn({ method: 'GET' }).handler(async () => {
  const rows = await db.select().from(venueT)

  const venues: Venue[] = rows.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address ?? '',
    city: v.city ?? '',
    country: v.country ?? '',
    lat: typeof v.lat === 'number' ? v.lat : 0,
    lng: typeof v.lng === 'number' ? v.lng : 0,
    type: (v.type as Venue['type']) ?? 'outdoor',
    sports: Array.isArray(v.sports) ? (v.sports as string[]) : [],
    facilities: Array.isArray(v.facilities) ? (v.facilities as string[]) : [],
    images: Array.isArray(v.photos) ? v.photos : [],
    orientationPlan: v.orientationPlan ?? undefined,
    description: v.description ?? undefined,
    accessInstructions: v.accessInstructions ?? undefined,
    openingHours: Array.isArray(v.openingHours)
      ? v.openingHours.reduce<Record<string, { open: string; close: string } | null>>(
          (acc, cur) => {
            if (cur && (cur as any).day) {
              acc[(cur as any).day] = { open: (cur as any).open, close: (cur as any).close }
            }
            return acc
          },
          {}
        )
      : undefined,
    price: typeof v.priceRangeMin === 'number' ? v.priceRangeMin : 0,
    currency: v.priceRangeCurrency ?? 'EUR',
    priceRange:
      typeof v.priceRangeMin === 'number' || typeof v.priceRangeMax === 'number'
        ? {
            min: typeof v.priceRangeMin === 'number' ? v.priceRangeMin : 0,
            max: typeof v.priceRangeMax === 'number' ? v.priceRangeMax : (typeof v.priceRangeMin === 'number' ? v.priceRangeMin : 0),
            currency: v.priceRangeCurrency ?? 'EUR'
          }
        : undefined,
    contactInfo: {
      phone: v.contactPhone ?? undefined,
      email: v.contactEmail ?? undefined,
      website: v.contactWebsite ?? undefined
    },
    rating: typeof v.rating === 'number' ? v.rating : undefined,
    totalRatings: typeof v.totalRatings === 'number' ? v.totalRatings : undefined,
    createdBy: v.createdBy ?? '',
    isVerified: Boolean(v.isVerified),
    createdAt: v.createdAt instanceof Date ? v.createdAt : new Date(),
    updatedAt: v.updatedAt instanceof Date ? v.updatedAt : new Date()
  }))

  return venues
})

export const getVenueById = createServerFn({ method: 'GET' })
  .validator((venueId: string) => venueId)
  .handler(async ({ data: venueId }) => {
    const rows = await db.select().from(venueT).where(eq(venueT.id, venueId))
    const v = rows[0]
    if (!v) {
      throw new Error(`Venue with id ${venueId} not found`)
    }
    const venue: Venue = {
      id: v.id,
      name: v.name,
      address: v.address ?? '',
      city: v.city ?? '',
      country: v.country ?? '',
      lat: typeof v.lat === 'number' ? v.lat : 0,
      lng: typeof v.lng === 'number' ? v.lng : 0,
      type: (v.type as Venue['type']) ?? 'outdoor',
      sports: Array.isArray(v.sports) ? (v.sports as string[]) : [],
      facilities: Array.isArray(v.facilities) ? (v.facilities as string[]) : [],
      images: Array.isArray(v.photos) ? v.photos : [],
      orientationPlan: v.orientationPlan ?? undefined,
      description: v.description ?? undefined,
      accessInstructions: v.accessInstructions ?? undefined,
      openingHours: Array.isArray(v.openingHours)
        ? v.openingHours.reduce<Record<string, { open: string; close: string } | null>>(
            (acc, cur) => {
              if (cur && (cur as any).day) {
                acc[(cur as any).day] = { open: (cur as any).open, close: (cur as any).close }
              }
              return acc
            },
            {}
          )
        : undefined,
      price: typeof v.priceRangeMin === 'number' ? v.priceRangeMin : 0,
      currency: v.priceRangeCurrency ?? 'EUR',
      priceRange:
        typeof v.priceRangeMin === 'number' || typeof v.priceRangeMax === 'number'
          ? {
              min: typeof v.priceRangeMin === 'number' ? v.priceRangeMin : 0,
              max: typeof v.priceRangeMax === 'number' ? v.priceRangeMax : (typeof v.priceRangeMin === 'number' ? v.priceRangeMin : 0),
              currency: v.priceRangeCurrency ?? 'EUR'
            }
          : undefined,
      contactInfo: {
        phone: v.contactPhone ?? undefined,
        email: v.contactEmail ?? undefined,
        website: v.contactWebsite ?? undefined
      },
      rating: typeof v.rating === 'number' ? v.rating : undefined,
      totalRatings: typeof v.totalRatings === 'number' ? v.totalRatings : undefined,
      createdBy: v.createdBy ?? '',
      isVerified: Boolean(v.isVerified),
      createdAt: v.createdAt instanceof Date ? v.createdAt : new Date(),
      updatedAt: v.updatedAt instanceof Date ? v.updatedAt : new Date()
    }
    return venue
  })

// Stats/Analytics functions
export const getAppStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Future: Replace with complex Turso aggregation queries
    // const stats = await db.select({
    //   totalEvents: count(eventsTable.id),
    //   totalUsers: count(usersTable.id),
    //   // ... more complex aggregations
    // }).from(eventsTable)

    return {
      eventsCreated: 2547,
      activeUsers: 8423,
      countries: 15,
      successRate: 95
    }
  }
)

// Utility function for uploading files to R2
async function uploadFileToR2(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('No file provided')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${file.type}`)
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`File too large: ${file.name}`)
  }
  const bindings = getBindings()

  const bucket = bindings.hraj_eu_uploads
  if (!bucket) {
    throw new Error('R2 bucket not available')
  }

  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension) {
    throw new Error(`File has no extension: ${file.name}`)
  }

  const filename = `${folder}/${timestamp}-${randomString}.${extension}`

  const arrayBuffer = await file.arrayBuffer()

  await bucket.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type
    }
  })

  return `https://uploads.hraj.eu/${filename}`
}

// File upload functions
export const uploadVenueImages = createServerFn({ method: 'POST' })
  .validator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        if (!file || file.size === 0) continue

        const url = await uploadFileToR2(file, 'venues')
        uploadedUrls.push(url)
      }

      return { urls: uploadedUrls }
    } catch (error) {
      console.error('Upload failed:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to upload images to R2 storage'
      )
    }
  })

export const uploadVenuePlan = createServerFn({ method: 'POST' })
  .validator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const file = formData.get('plan') as File

    try {
      const url = await uploadFileToR2(file, 'venue-plans')
      return { url }
    } catch (error) {
      console.error('Upload failed:', error)
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to upload plan to R2 storage'
      )
    }
  })
