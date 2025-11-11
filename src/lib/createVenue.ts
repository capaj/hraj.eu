import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createInsertSchema } from 'drizzle-zod'
import { venueT as venueTable } from '../../drizzle/schema'
import { db } from 'drizzle/db'
import { auth } from './auth'

// Base insert schema generated from Drizzle table
// Make all fields optional to allow us to validate a transformed subset safely
const VenueInsertBaseSchema = createInsertSchema(venueTable).partial()

// Helper to normalize TanStack serializer undefined token objects like { $undefined: any }
const normalizeMaybeUndefined = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .union([inner, z.object({ $undefined: z.any() })])
    .transform((v) =>
      typeof v === 'object' && v && '$undefined' in v ? undefined : v
    )

// Client payload schema (what frontend sends)
const ClientVenueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: normalizeMaybeUndefined(z.string())
    .nullable()
    .optional()
    .transform((v) => (v ?? '') as string),
  city: z.string().min(1, 'City is required'),
  country: normalizeMaybeUndefined(z.string())
    .nullable()
    .optional()
    .transform((v) => (v ?? '') as string),
  type: z.enum(['outdoor', 'indoor', 'mixed']).optional(),
  sports: z.array(z.string()).min(1, 'At least one sport is required'),
  facilities: z
    .array(
      z.enum([
        'parking',
        'restrooms',
        'food',
        'lounge',
        'wifi',
        'locker_room',
        'shower',
        'dressing_room'
      ])
    )
    .optional()
    .default([]),
  description: normalizeMaybeUndefined(z.string()).optional(),
  accessInstructions: normalizeMaybeUndefined(z.string()).optional(),
  images: z.array(z.url().or(z.string())).optional().default([]),
  orientationPlan: normalizeMaybeUndefined(z.string()).optional(),
  contactInfo: z
    .object({
      phone: normalizeMaybeUndefined(z.string()).optional(),
      email: normalizeMaybeUndefined(
        z
          .string()
          .email()
          .or(z.literal(''))
          .transform((v) => (v || undefined) as string | undefined)
      ).optional(),
      website: normalizeMaybeUndefined(
        z
          .string()
          .url()
          .or(z.literal(''))
          .transform((v) => (v || undefined) as string | undefined)
      ).optional()
    })
    .partial()
    .optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isVerified: z.boolean().optional()
})

// Transform client payload to DB insert shape according to venue table columns
const VenueInsertSchema = createInsertSchema(venueTable)

// Narrow the server function return type to a serializable domain object
type InsertedVenue = z.infer<typeof VenueInsertSchema> & {
  id?: string | number | bigint
}

export const createVenue = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = ClientVenueSchema.safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      throw new Error(`Invalid venue data: ${issues}`)
    }
    return parsed.data
  })
  .handler(async ({ data }: { data: z.output<typeof ClientVenueSchema> }) => {
    // Get the current user from the session
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      throw new Error('You must be logged in to create a venue')
    }

    const insertData = VenueInsertSchema.parse({
      name: data.name,
      address: data.address ?? '',
      city: data.city,
      country: data.country ?? '',
      lat: data.lat,
      lng: data.lng,
      type: data.type,
      orientationPlan: data.orientationPlan,
      photos: data.images ?? [],
      description: data.description,
      accessInstructions: data.accessInstructions,
      priceRangeMin: typeof data.price === 'number' ? data.price : undefined,
      priceRangeMax: typeof data.price === 'number' ? data.price : undefined,
      priceRangeCurrency: data.currency,
      contactPhone: data.contactInfo?.phone,
      contactEmail: data.contactInfo?.email,
      contactWebsite: data.contactInfo?.website,

      facilities: (data.facilities as InsertedVenue['facilities']) ?? [],
      sports: (data.sports as InsertedVenue['sports']) ?? [],
      isVerified: data.isVerified ?? false,
      createdBy: session.user.id
    })

    const inserted = await db.insert(venueTable).values(insertData).returning()

    console.log('inserted', inserted[0])
    return inserted?.[0].id
  })
