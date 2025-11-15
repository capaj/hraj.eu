import { db } from '../../drizzle/db'
import { recurringEventT, eventT } from '../../drizzle/schema'
import { eq, and, or, isNull, lte } from 'drizzle-orm'

/**
 * Generates event instances for all active recurring events
 * Creates events at least 2 weeks (14 days) in advance
 */
export async function generateRecurringEvents() {
  console.log('Starting recurring event generation...')

  const now = new Date()
  const twoWeeksFromNow = new Date(now)
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

  // Get all active recurring events
  const activeRecurringEvents = await db
    .select()
    .from(recurringEventT)
    .where(eq(recurringEventT.isActive, true))

  console.log(`Found ${activeRecurringEvents.length} active recurring events`)

  let totalEventsCreated = 0

  for (const recurringEvent of activeRecurringEvents) {
    try {
      const eventsCreated = await generateEventsForRecurring(
        recurringEvent,
        twoWeeksFromNow
      )
      totalEventsCreated += eventsCreated
    } catch (error) {
      console.error(
        `Error generating events for recurring event ${recurringEvent.id}:`,
        error
      )
    }
  }

  console.log(`Recurring event generation complete. Created ${totalEventsCreated} events.`)
  return { eventsCreated: totalEventsCreated }
}

async function generateEventsForRecurring(
  recurringEvent: typeof recurringEventT.$inferSelect,
  targetDate: Date
): Promise<number> {
  // Determine the interval in days
  let intervalDays: number
  if (recurringEvent.intervalDays) {
    intervalDays = recurringEvent.intervalDays
  } else if (recurringEvent.intervalWeeks) {
    intervalDays = recurringEvent.intervalWeeks * 7
  } else {
    console.error(
      `Recurring event ${recurringEvent.id} has no interval defined`
    )
    return 0
  }

  // Start from lastGeneratedDate or startDate
  const startFrom = recurringEvent.lastGeneratedDate
    ? new Date(recurringEvent.lastGeneratedDate)
    : new Date(recurringEvent.startDate)

  // Start generating from the next occurrence after lastGeneratedDate/startDate
  let currentDate = new Date(startFrom)
  currentDate.setDate(currentDate.getDate() + intervalDays)

  const eventsToCreate: typeof eventT.$inferInsert[] = []

  // Generate events until we reach the target date (2 weeks from now)
  while (currentDate <= targetDate) {
    // Check if we've exceeded the end date (if specified)
    if (recurringEvent.endDate && currentDate > new Date(recurringEvent.endDate)) {
      break
    }

    const dateString = formatDate(currentDate)

    // Check if an event already exists for this date
    const existingEvent = await db
      .select()
      .from(eventT)
      .where(
        and(
          eq(eventT.recurringEventId, recurringEvent.id),
          eq(eventT.date, dateString)
        )
      )
      .limit(1)

    if (existingEvent.length === 0) {
      // Create new event instance
      eventsToCreate.push({
        title: recurringEvent.title,
        description: recurringEvent.description,
        sport: recurringEvent.sport,
        venueId: recurringEvent.venueId,
        date: dateString,
        startTime: recurringEvent.startTime,
        duration: recurringEvent.duration,
        minParticipants: recurringEvent.minParticipants,
        idealParticipants: recurringEvent.idealParticipants,
        maxParticipants: recurringEvent.maxParticipants,
        cancellationDeadlineMinutes: recurringEvent.cancellationDeadlineMinutes,
        price: recurringEvent.price,
        paymentDetails: recurringEvent.paymentDetails,
        gameRules: recurringEvent.gameRules,
        isPublic: recurringEvent.isPublic,
        organizerId: recurringEvent.organizerId,
        requiredSkillLevel: recurringEvent.requiredSkillLevel,
        recurringEventId: recurringEvent.id,
        status: 'open'
      })
    }

    // Move to next occurrence
    currentDate.setDate(currentDate.getDate() + intervalDays)
  }

  // Insert all events
  if (eventsToCreate.length > 0) {
    await db.insert(eventT).values(eventsToCreate)

    // Update lastGeneratedDate
    const lastDate = new Date(targetDate)
    await db
      .update(recurringEventT)
      .set({ lastGeneratedDate: formatDate(lastDate) })
      .where(eq(recurringEventT.id, recurringEvent.id))

    console.log(
      `Created ${eventsToCreate.length} events for recurring event ${recurringEvent.id}`
    )
  }

  return eventsToCreate.length
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
