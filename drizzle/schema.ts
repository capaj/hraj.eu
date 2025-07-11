import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex
} from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
export * from './auth-schema'
import { user } from './auth-schema'
import { SPORTS } from '~/lib/constants'

export const userSkill = sqliteTable(
  'user_skill',
  {
    id: integer('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sport: text('sport').notNull(),
    skillLevel: text('skill_level', {
      enum: ['beginner', 'intermediate', 'advanced']
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    userSportIdx: uniqueIndex('user_sport_idx').on(table.userId, table.sport)
  })
)

export const userSkillRelations = relations(userSkill, ({ one }) => ({
  user: one(user, {
    fields: [userSkill.userId],
    references: [user.id]
  })
}))

export const event = sqliteTable(
  'event',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    sport: text('sport').notNull(),
    venueId: text('venue_id').references(() => venue.id, {
      onDelete: 'set null'
    }),
    date: text('date').notNull(),
    startTime: text('start_time').notNull(),
    duration: integer('duration').notNull(),
    minParticipants: integer('min_participants').notNull(),
    idealParticipants: integer('ideal_participants'),
    maxParticipants: integer('max_participants').notNull(),
    /** time in minutes when the event is checked for minimum participants count and cancelled if not enough participants */
    cancellationDeadlineMinutes: integer(
      'cancellation_deadline_minutes'
    ).notNull(),
    price: real('price'),
    paymentDetails: text('payment_details'),
    gameRules: text('game_rules'),
    isPublic: integer('is_public', { mode: 'boolean' }).default(true).notNull(),
    organizerId: text('organizer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requiredSkillLevel: text('required_skill_level', {
      enum: ['beginner', 'intermediate', 'advanced']
    }),
    status: text('status', {
      enum: ['open', 'confirmed', 'cancelled', 'completed']
    })
      .default('open')
      .notNull(),
    cancellationReason: text('cancellation_reason'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    sportDateIdx: index('sport_date_idx').on(table.sport, table.date),
    organizerIdx: index('organizer_idx').on(table.organizerId),
    venueIdx: index('venue_idx').on(table.venueId)
  })
)

export const eventRelations = relations(event, ({ one, many }) => ({
  organizer: one(user, {
    fields: [event.organizerId],
    references: [user.id],
    relationName: 'organizer'
  }),
  venue: one(venue, {
    fields: [event.venueId],
    references: [venue.id]
  }),
  participants: many(participant)
}))

export const participant = sqliteTable(
  'participant',
  {
    id: integer('id').primaryKey().notNull(),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['confirmed', 'cancelled', 'waitlisted', 'invited', 'declined']
    })
      .default('invited')
      .notNull(),
    confirmedParticipantOrdinal: integer(
      'confirmed_participant_ordinal'
    ).notNull(), // 1 based index. We multiply karma points by event participation count - this. The first user who confirms gets 100% of the karma points.
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .notNull()
  },
  (table) => ({
    eventUserIdx: uniqueIndex('event_user_idx').on(table.eventId, table.userId)
  })
)

export const participantRelations = relations(participant, ({ one }) => ({
  event: one(event, {
    fields: [participant.eventId],
    references: [event.id]
  }),
  user: one(user, {
    fields: [participant.userId],
    references: [user.id]
  })
}))

export const venue = sqliteTable(
  'venue',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city'),
    country: text('country'),
    lat: real('lat'),
    lng: real('lng'),
    type: text('type', { enum: ['indoor', 'outdoor', 'mixed'] }),
    orientationPlan: text('orientation_plan'),
    photos: text('photos', { mode: 'json' }).$type<string[]>(),
    description: text('description'),
    accessInstructions: text('access_instructions'),
    openingHours: text('opening_hours', { mode: 'json' }).$type<
      {
        day: string
        open: string
        close: string
      }[]
    >(),
    priceRangeMin: real('price_range_min'),
    priceRangeMax: real('price_range_max'),
    priceRangeCurrency: text('price_range_currency'),
    contactPhone: text('contact_phone'),
    contactEmail: text('contact_email'),
    contactWebsite: text('contact_website'),
    rating: real('rating'),
    totalRatings: integer('total_ratings'),
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'set null'
    }),
    facilities: text('facilities', { mode: 'json' }).$type<
      Array<
        | 'parking'
        | 'restrooms'
        | 'food'
        | 'lounge'
        | 'wifi'
        | 'locker_room'
        | 'shower'
        | 'dressing_room'
      >
    >(),
    sports: text('sports', { mode: 'json' }).$type<
      Array<(typeof SPORTS)[number]['id']>
    >(),
    isVerified: integer('is_verified', { mode: 'boolean' })
      .default(false)
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (table) => ({
    cityIdx: index('city_idx').on(table.city)
  })
)

export const venueRelations = relations(venue, ({ one, many }) => ({
  creator: one(user, {
    fields: [venue.createdBy],
    references: [user.id]
  })
}))

export const notification = sqliteTable(
  'notification',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'event_invited',
        'event_confirmed',
        'event_cancelled',
        'karma_received',
        'event_reminder',
        'payment_received',
        'moved_from_waitlist'
      ]
    }).notNull(),
    title: text('title'),
    message: text('message'),
    eventId: text('event_id').references(() => event.id, {
      onDelete: 'cascade'
    }),
    fromUserId: text('from_user_id').references(() => user.id, {
      onDelete: 'cascade'
    }),
    isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .notNull()
  },
  (table) => ({
    userIdx: index('user_idx').on(table.userId)
  })
)

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id]
  }),
  event: one(event, {
    fields: [notification.eventId],
    references: [event.id]
  }),
  fromUser: one(user, {
    fields: [notification.fromUserId],
    references: [user.id]
  })
}))

// User relations that reference the other tables
export const userRelations = relations(user, ({ many }) => ({
  skills: many(userSkill),
  organizedEvents: many(event, { relationName: 'organizer' }),
  participatedEvents: many(participant),
  createdVenues: many(venue),
  notifications: many(notification)
}))

export const eventFeedback = sqliteTable(
  'event_feedback',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    eventId: text('event_id')
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    toUserId: text('to_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rating: integer('rating'),
    comment: text('comment'),
    noShow: integer('no_show', { mode: 'boolean' }).default(false).notNull(),
    badBehavior: integer('bad_behavior', { mode: 'boolean' })
      .default(false)
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(current_timestamp)`)
      .notNull()
  },
  (table) => ({
    eventFromToIdx: uniqueIndex('event_feedback_from_to_idx').on(
      table.eventId,
      table.fromUserId,
      table.toUserId
    )
  })
)

export const eventFeedbackRelations = relations(eventFeedback, ({ one }) => ({
  event: one(event, {
    fields: [eventFeedback.eventId],
    references: [event.id]
  }),
  fromUser: one(user, {
    fields: [eventFeedback.fromUserId],
    references: [user.id]
  }),
  toUser: one(user, { fields: [eventFeedback.toUserId], references: [user.id] })
}))
