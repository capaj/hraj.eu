import { createServerFn } from '@tanstack/react-start'
import { Event, User, Notification, Venue } from '../types'
import { db } from '../../drizzle/db'
import { eventT, participantT, venueT, user as userTable } from '../../drizzle/schema'
import { eq, and, sql, gte, count } from 'drizzle-orm'

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
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Query upcoming events from database
    const eventsFromDb = await db
      .select()
      .from(eventT)
      .where(gte(eventT.date, today))
      .limit(limit)

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

        const confirmedParticipants = participants
          .filter((p) => p.status === 'confirmed')
          .map((p) => p.userId)

        const waitlistedParticipants = participants
          .filter((p) => p.status === 'waitlisted')
          .map((p) => p.userId)

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

    // Sort by date and time
    return eventsWithParticipants.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )
  })

export const getEventsByFilters = createServerFn({ method: 'GET' })
  .inputValidator(
    (filters: { sport?: string; skillLevel?: string; location?: string }) =>
      filters
  )
  .handler(async ({ data: filters }) => {
    // Build query conditions
    let query = db.select().from(eventT)

    // Apply sport filter if provided
    if (filters.sport) {
      query = query.where(eq(eventT.sport, filters.sport)) as any
    }

    // Apply skill level filter if provided
    if (filters.skillLevel) {
      query = query.where(
        eq(eventT.requiredSkillLevel, filters.skillLevel as any)
      ) as any
    }

    const eventsFromDb = await query

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

        const confirmedParticipants = participants
          .filter((p) => p.status === 'confirmed')
          .map((p) => p.userId)

        const waitlistedParticipants = participants
          .filter((p) => p.status === 'waitlisted')
          .map((p) => p.userId)

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

export const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  // Query users from database
  const usersFromDb = await db.select().from(userTable)

  // Transform database users to frontend User type
  const users = usersFromDb.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image || undefined,
    karmaPoints: user.karmaPoints || 0,
    skillLevels: {}, // TODO: fetch from userSkillT table if needed
    notificationPreferences: {}, // TODO: implement notification preferences table
    preferredCurrency: user.preferredCurrency || 'CZK',
    location:
      user.city && user.country ? `${user.city}, ${user.country}` : undefined,
    revTag: user.revolutTag || undefined,
    bankAccount: user.bankAccount || undefined,
    createdAt: new Date(user.createdAt)
  })) as User[]

  return users
})

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // Query user from database
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)

    if (!users || users.length === 0) {
      throw new Error(`User with id ${userId} not found`)
    }

    const user = users[0]

    // Transform database user to frontend User type
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || undefined,
      karmaPoints: user.karmaPoints || 0,
      skillLevels: {}, // TODO: fetch from userSkillT table if needed
      notificationPreferences: {}, // TODO: implement notification preferences table
      preferredCurrency: user.preferredCurrency || 'CZK',
      location:
        user.city && user.country ? `${user.city}, ${user.country}` : undefined,
      revTag: user.revolutTag || undefined,
      bankAccount: user.bankAccount || undefined,
      createdAt: new Date(user.createdAt)
    } as User
  })

export const getUserNotifications = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // TODO: Implement notifications table in database
    // For now, return empty array since we don't have notifications table yet
    // const notifications = await db.select().from(notificationsTable)
    //   .where(eq(notificationsTable.userId, userId))
    //   .orderBy(desc(notificationsTable.createdAt))

    return [] as Notification[]
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

  return venues
})

export const getVenuesByUserId = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const venuesFromDb = await db
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

// Stats/Analytics functions
export const getAppStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [eventsCountResult] = await db.select({ count: count() }).from(eventT)

    const [activeUsersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${participantT.userId})` })
      .from(participantT)
      .where(eq(participantT.status, 'confirmed'))

    const [countriesResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${venueT.country})` })
      .from(venueT)
      .where(sql`${venueT.country} IS NOT NULL`)

    const [completedEventsResult] = await db
      .select({ count: count() })
      .from(eventT)
      .where(eq(eventT.status, 'completed'))

    const [cancelledEventsResult] = await db
      .select({ count: count() })
      .from(eventT)
      .where(eq(eventT.status, 'cancelled'))

    const eventsCreated = eventsCountResult?.count || 0
    const activeUsers = Number(activeUsersResult?.count) || 0
    const countries = Number(countriesResult?.count) || 0

    const completedEvents = completedEventsResult?.count || 0
    const cancelledEvents = cancelledEventsResult?.count || 0
    const totalFinishedEvents = completedEvents + cancelledEvents
    const successRate =
      totalFinishedEvents > 0
        ? Math.round((completedEvents / totalFinishedEvents) * 100)
        : 0

    return {
      eventsCreated,
      activeUsers,
      countries,
      successRate
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
