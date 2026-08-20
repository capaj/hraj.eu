import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../drizzle/db'
import { user } from '../../drizzle/schema'
import { requireAdmin } from './adminPermissions'

const banUnits = ['days', 'weeks', 'months'] as const

export type EventJoinBanUnit = (typeof banUnits)[number]

const SetEventJoinBanSchema = z.object({
  userId: z.string().min(1),
  duration: z.number().int().min(1).max(3650),
  unit: z.enum(banUnits)
})

function getBanExpiry(duration: number, unit: EventJoinBanUnit) {
  const expiry = new Date()

  if (unit === 'days') {
    expiry.setDate(expiry.getDate() + duration)
    return expiry
  }

  if (unit === 'weeks') {
    expiry.setDate(expiry.getDate() + duration * 7)
    return expiry
  }

  const dayOfMonth = expiry.getDate()
  expiry.setDate(1)
  expiry.setMonth(expiry.getMonth() + duration)
  const lastDayOfTargetMonth = new Date(
    expiry.getFullYear(),
    expiry.getMonth() + 1,
    0
  ).getDate()
  expiry.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth))
  return expiry
}

export const setEventJoinBan = createServerFn({ method: 'POST' })
  .inputValidator((payload: unknown) => SetEventJoinBanSchema.parse(payload))
  .handler(async ({ data }) => {
    await requireAdmin()

    const eventJoinBannedUntil = getBanExpiry(data.duration, data.unit)
    const [bannedUser] = await db
      .update(user)
      .set({ eventJoinBannedUntil })
      .where(eq(user.id, data.userId))
      .returning({
        id: user.id,
        eventJoinBannedUntil: user.eventJoinBannedUntil
      })

    if (!bannedUser) {
      throw new Error('User not found')
    }

    return bannedUser
  })
