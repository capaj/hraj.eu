import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    email: text("email").notNull(),
    name: text("name"),
    avatar: text("avatar"),
    phone: text("phone"),
    karmaPoints: integer("karma_points").default(0).notNull(),
    preferredCurrency: text("preferred_currency"),
    location: text("location"),
    revTag: text("rev_tag"),
    bankAccount: text("bank_account"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("email_idx").on(table.email),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  skills: many(userSkills),
  organizedEvents: many(events, { relationName: "organizer" }),
  participatedEvents: many(participants),
  waitlistedEvents: many(waitlist),
  createdVenues: many(venues),
  notifications: many(notifications),
}));

export const userSkills = sqliteTable(
  "user_skills",
  {
    id: integer("id")
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sport: text("sport").notNull(),
    skillLevel: text("skill_level", {
      enum: ["beginner", "intermediate", "advanced"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    userSportIdx: uniqueIndex("user_sport_idx").on(table.userId, table.sport),
  })
);

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
}));

export const events = sqliteTable(
  "events",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sport: text("sport").notNull(),
    venueId: text("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    duration: integer("duration").notNull(),
    minParticipants: integer("min_participants").notNull(),
    idealParticipants: integer("ideal_participants"),
    maxParticipants: integer("max_participants").notNull(),
    cancellationDeadlineHours: integer("cancellation_deadline_hours").notNull(),
    price: real("price"),
    paymentDetails: text("payment_details"),
    gameRules: text("game_rules"),
    cutoffTime: integer("cutoff_time", { mode: "timestamp" }).notNull(),
    isPublic: integer("is_public", { mode: "boolean" }).default(true).notNull(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["open", "confirmed", "cancelled", "completed"],
    })
      .default("open")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    sportDateIdx: index("sport_date_idx").on(table.sport, table.date),
    organizerIdx: index("organizer_idx").on(table.organizerId),
    venueIdx: index("venue_idx").on(table.venueId),
  })
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
    relationName: "organizer",
  }),
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  participants: many(participants),
  waitlist: many(waitlist),
}));

export const participants = sqliteTable(
  "participants",
  {
    id: integer("id")
      .primaryKey()
      .notNull(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    eventUserIdx: uniqueIndex("event_user_idx").on(table.eventId, table.userId),
  })
);

export const participantsRelations = relations(participants, ({ one }) => ({
  event: one(events, {
    fields: [participants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
}));

export const waitlist = sqliteTable(
  "waitlist",
  {
    id: integer("id")
      .primaryKey()
      .notNull(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    eventUserIdx: uniqueIndex("waitlist_event_user_idx").on(
      table.eventId,
      table.userId
    ),
    eventIdx: index("event_idx").on(table.eventId),
  })
);

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  event: one(events, {
    fields: [waitlist.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [waitlist.userId],
    references: [users.id],
  }),
}));

export const venues = sqliteTable(
  "venues",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    name: text("name").notNull(),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    lat: real("lat"),
    lng: real("lng"),
    type: text("type", { enum: ["indoor", "outdoor", "mixed"] }),
    orientationPlan: text("orientation_plan"),
    description: text("description"),
    accessInstructions: text("access_instructions"),
    openingHours: text("opening_hours"), // JSON stored as text
    priceRangeMin: real("price_range_min"),
    priceRangeMax: real("price_range_max"),
    priceRangeCurrency: text("price_range_currency"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    contactWebsite: text("contact_website"),
    rating: real("rating"),
    totalRatings: integer("total_ratings"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    isVerified: integer("is_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    cityIdx: index("city_idx").on(table.city),
  })
);

export const venuesRelations = relations(venues, ({ one, many }) => ({
  creator: one(users, {
    fields: [venues.createdBy],
    references: [users.id],
  }),
  facilities: many(venueFacilities),
  sports: many(venueSports),
}));

export const venueFacilities = sqliteTable(
  "venue_facilities",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    facility: text("facility").notNull(),
  },
  (table) => ({
    venueFacilityIdx: uniqueIndex("venue_facility_idx").on(
      table.venueId,
      table.facility
    ),
  })
);

export const venueFacilitiesRelations = relations(venueFacilities, ({ one }) => ({
  venue: one(venues, {
    fields: [venueFacilities.venueId],
    references: [venues.id],
  }),
}));

export const venueSports = sqliteTable(
  "venue_sports",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    sport: text("sport").notNull(),
  },
  (table) => ({
    venueSportIdx: uniqueIndex("venue_sport_idx").on(table.venueId, table.sport),
  })
);

export const venueSportsRelations = relations(venueSports, ({ one }) => ({
  venue: one(venues, {
    fields: [venueSports.venueId],
    references: [venues.id],
  }),
}));

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id")
      .$defaultFn(() => createId())
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: [
        "event_joined",
        "event_confirmed",
        "event_cancelled",
        "karma_received",
        "event_reminder",
        "payment_received",
        "moved_from_waitlist",
      ],
    }).notNull(),
    title: text("title"),
    message: text("message"),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    fromUserId: text("from_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
  }),
}));