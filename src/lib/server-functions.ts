import { createServerFn } from '@tanstack/react-start'
import {
  mockEvents,
  mockUsers,
  mockNotifications,
  mockVenues
} from './mock-data'
import { Event, User, Notification, Venue } from '../types'
import { db } from '../../drizzle/db'
import { eventT, participantT, venueT } from '../../drizzle/schema'
import { eq, and, sql } from 'drizzle-orm'

import { env } from 'cloudflare:workers'

// Fetch all events with participants from database
export const getEvents = createServerFn({ method: 'GET' }).handler(async () => {
  // Query events from database
  const eventsFromDb = await db.select().from(eventT)

  // For each event, get its participants
  const eventsWithParticipants = await Promise.all(
    eventsFromDb.map(async (event) => {
      const participants = await db
        .select({
          userId: participantT.userId,
          status: participantT.status
        })
        .from(participantT)
        .where(eq(participantT.eventId, event.id))

      // Separate confirmed participants from waitlisted
      const confirmedParticipants = participants
        .filter((p) => p.status === 'confirmed')
        .map((p) => p.userId)

      const waitlistedParticipants = participants
        .filter((p) => p.status === 'waitlisted')
        .map((p) => p.userId)

      // Transform database event to frontend Event type
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
        status: event.status as Event['status'],
        allowedSkillLevels: event.requiredSkillLevel
          ? [event.requiredSkillLevel]
          : undefined,
        requireSkillLevel: !!event.requiredSkillLevel,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      } as Event
    })
  )

  return eventsWithParticipants
})

export const getEventById = createServerFn({ method: 'GET' })
  .inputValidator((eventId: string) => eventId)
  .handler(async ({ data: eventId }) => {
    // Query event from database
    const events = await db
      .select()
      .from(eventT)
      .where(eq(eventT.id, eventId))
      .limit(1)

    if (!events || events.length === 0) {
      throw new Error(`Event with id ${eventId} not found`)
    }

    const event = events[0]

    // Get participants for this event
    const participants = await db
      .select({
        userId: participantT.userId,
        status: participantT.status
      })
      .from(participantT)
      .where(eq(participantT.eventId, event.id))

    // Separate confirmed participants from waitlisted
    const confirmedParticipants = participants
      .filter((p) => p.status === 'confirmed')
      .map((p) => p.userId)

    const waitlistedParticipants = participants
      .filter((p) => p.status === 'waitlisted')
      .map((p) => p.userId)

    // Transform database event to frontend Event type
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
      status: event.status as Event['status'],
      allowedSkillLevels: event.requiredSkillLevel
        ? [event.requiredSkillLevel]
        : undefined,
      requireSkillLevel: !!event.requiredSkillLevel,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    } as Event
  })

export const getUpcomingEvents = createServerFn({ method: 'GET' })
  .inputValidator((limit?: number) => limit || 3)
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
  .inputValidator(
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
  .inputValidator((userId: string) => userId)
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
  .inputValidator((userId: string) => userId)
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
  // Query venues from database
  const venuesFromDb = await db.select().from(venueT)

  // Transform database venues to frontend Venue type
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
      openingHours: (venue.openingHours as Venue['openingHours']) || undefined,
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

  return venues
})

export const getVenueById = createServerFn({ method: 'GET' })
  .inputValidator((venueId: string) => venueId)
  .handler(async ({ data: venueId }) => {
    // Query venue from database
    const venues = await db
      .select()
      .from(venueT)
      .where(eq(venueT.id, venueId))
      .limit(1)

    if (!venues || venues.length === 0) {
      throw new Error(`Venue with id ${venueId} not found`)
    }

    const venue = venues[0]

    // Transform database venue to frontend Venue type
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
      openingHours: (venue.openingHours as Venue['openingHours']) || undefined,
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

  const bucket = env.hraj_eu_uploads
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
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData, context }) => {
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
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData, context }) => {
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
