import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { venueT as venueTable } from '../../drizzle/schema'
import { db } from 'drizzle/db'
import { auth } from '~/lib/auth'
import { eq } from 'drizzle-orm'
import { SPORTS } from '~/lib/constants'

const normalizeMaybeUndefined = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .union([inner, z.object({ $undefined: z.any() })])
    .transform((v) =>
      typeof v === 'object' && v && '$undefined' in v ? undefined : v
    )

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

const transformVenueData = (
  data: z.output<typeof ClientVenueSchema>,
  existingVenue?: {
    lat?: number | null
    lng?: number | null
    type?: string | null
  }
) => ({
  name: data.name,
  address: data.address ?? '',
  city: data.city,
  country: data.country ?? '',
  lat: data.lat ?? existingVenue?.lat ?? undefined,
  lng: data.lng ?? existingVenue?.lng ?? undefined,
  type:
    data.type ??
    (existingVenue?.type as 'outdoor' | 'indoor' | 'mixed' | undefined),
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
  facilities: data.facilities ?? [],
  sports: (data.sports as Array<(typeof SPORTS)[number]['id']>) ?? []
})

export const updateVenue = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => {
    const parsed = ClientVenueSchema.extend({
      id: z.string().min(1, 'Venue ID is required')
    }).safeParse(payload)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      throw new Error(`Invalid venue data: ${issues}`)
    }
    return parsed.data
  })
  .handler(
    async ({
      data
    }: {
      data: z.output<typeof ClientVenueSchema> & { id: string }
    }) => {
      const request = getRequest()
      const session = await auth.api.getSession({ headers: request.headers })

      if (!session?.user?.id) {
        throw new Error('You must be logged in to update a venue')
      }

      const existingVenue = await db
        .select()
        .from(venueTable)
        .where(eq(venueTable.id, data.id))
        .limit(1)

      if (
        !existingVenue.length ||
        existingVenue[0].createdBy !== session.user.id
      ) {
        throw new Error(
          'Venue not found or you do not have permission to update it'
        )
      }

      const updateData = {
        ...transformVenueData(data, existingVenue[0])
      }

      await db
        .update(venueTable)
        .set(updateData)
        .where(eq(venueTable.id, data.id))

      return data.id
    }
  )

