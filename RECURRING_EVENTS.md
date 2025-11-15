# Recurring Events Implementation

This document describes the recurring events feature that has been added to the hraj.eu platform.

## Overview

The recurring events feature allows event organizers to create events that repeat automatically on a schedule. The system supports two types of recurrence:

- **Day-based**: Events that repeat every X days (e.g., every 2 days, every 5 days)
- **Week-based**: Events that repeat every X weeks (e.g., weekly, bi-weekly)

## Database Schema

### `recurring_event` Table

The new `recurring_event` table stores the template configuration for recurring events:

- **Event Details**: title, description, sport, venue, time, duration, participants, price, etc.
- **Recurrence Pattern**:
  - `intervalDays`: Number of days between occurrences (for day-based recurrence)
  - `intervalWeeks`: Number of weeks between occurrences (for week-based recurrence)
  - `startDate`: First date when events should start being generated
  - `endDate`: Optional end date (if not set, events continue indefinitely)
  - `lastGeneratedDate`: Tracks the last date for which events were generated
  - `isActive`: Allows pausing/stopping the recurrence

### `event` Table Updates

The `event` table now includes:
- `recurringEventId`: Foreign key reference to the parent recurring event (nullable)

Events created from a recurring pattern will have this field populated, linking them back to their source configuration.

## Server API

### Creating a Recurring Event

Use the `createRecurringEvent` server function:

```typescript
import { createRecurringEvent } from '~/lib/createRecurringEvent'

// Example: Create a weekly basketball game
const recurringEvent = await createRecurringEvent({
  title: 'Weekly Basketball',
  description: 'Every Monday evening basketball game',
  sport: 'basketball',
  venueId: 'venue-123',
  startTime: '19:00',
  duration: 90,
  minParticipants: 6,
  idealParticipants: 10,
  maxParticipants: 12,
  cancellationHours: 2,
  cancellationMinutes: 0,
  isPublic: true,
  recurrenceType: 'weeks',
  intervalValue: 1, // Every 1 week
  startDate: '2025-11-18', // Start next Monday
  endDate: '2026-05-31' // Optional: end in 6 months
})
```

**Recurrence Types:**
- `recurrenceType: 'days'` with `intervalValue: 3` = every 3 days
- `recurrenceType: 'weeks'` with `intervalValue: 2` = every 2 weeks (bi-weekly)

## Automated Event Generation

### Cron Job

A Cloudflare Worker cron job runs **daily at midnight (00:00 UTC)** to generate upcoming event instances.

**Configuration** (in `wrangler.jsonc`):
```json
{
  "triggers": {
    "crons": ["0 0 * * *"]
  }
}
```

### Generation Logic

The cron job (`worker.ts` - `scheduled` handler):
1. Fetches all active recurring events
2. For each recurring event:
   - Calculates the next occurrence dates up to 2 weeks in advance
   - Checks if events already exist for those dates
   - Creates missing event instances
   - Updates `lastGeneratedDate`

**Example:**
- Today: November 15, 2025
- Target: Generate events through November 29, 2025 (14 days ahead)
- For a weekly Monday event: Creates events for Nov 18, Nov 25

### Implementation Details

See `src/lib/generate-recurring-events.ts` for the full logic:
- `generateRecurringEvents()`: Main entry point
- `generateEventsForRecurring()`: Generates events for a single recurring pattern
- Handles both `intervalDays` and `intervalWeeks`
- Respects `endDate` if set
- Prevents duplicate event creation

## UI Integration (To Be Implemented)

To add recurring events to the UI, you can:

1. **Add a toggle to CreateEventForm**:
   ```tsx
   const [isRecurring, setIsRecurring] = useState(false)
   ```

2. **Conditionally show recurrence fields**:
   ```tsx
   {isRecurring && (
     <>
       <select name="recurrenceType">
         <option value="days">Days</option>
         <option value="weeks">Weeks</option>
       </select>
       <input type="number" name="intervalValue" min="1" />
       <input type="date" name="startDate" />
       <input type="date" name="endDate" />
     </>
   )}
   ```

3. **Submit to different endpoint**:
   ```tsx
   if (isRecurring) {
     await createRecurringEvent(formData)
   } else {
     await createEvent(formData)
   }
   ```

## Managing Recurring Events

### Viewing Linked Events

To find all events created from a recurring pattern:

```typescript
const events = await db
  .select()
  .from(eventT)
  .where(eq(eventT.recurringEventId, 'recurring-event-id'))
```

### Pausing/Stopping Recurrence

Update the `isActive` field:

```typescript
await db
  .update(recurringEventT)
  .set({ isActive: false })
  .where(eq(recurringEventT.id, 'recurring-event-id'))
```

### Editing a Recurring Event

Editing the recurring event template will only affect **future** events created by the cron job. Existing events are independent and remain unchanged.

## Migration

To apply the database schema changes:

```bash
pnpm run migrate
```

This will create the `recurring_event` table and add the `recurring_event_id` column to the `event` table.

## Testing the Cron Job Locally

To test the scheduled job without waiting for midnight:

```bash
wrangler dev --test-scheduled
```

Then trigger the scheduled event manually in the Wrangler dashboard or use the Cloudflare dashboard to test scheduled events.

## Production Deployment

1. **Deploy the Worker**:
   ```bash
   pnpm run wrdeploy
   ```

2. **Run Migration** (if not automated):
   Ensure database migrations are applied to production.

3. **Verify Cron Trigger**:
   - Check Cloudflare dashboard
   - Navigate to Workers & Pages > Your Worker > Triggers
   - Confirm cron schedule is set: `0 0 * * *`

4. **Monitor Logs**:
   - View cron job execution logs in Cloudflare dashboard
   - Check for successful event generation

## Examples

### Daily Tennis Practice
```typescript
createRecurringEvent({
  title: 'Morning Tennis',
  sport: 'tennis',
  recurrenceType: 'days',
  intervalValue: 1, // Every day
  startTime: '08:00',
  duration: 60,
  startDate: '2025-11-16'
  // No endDate = continues indefinitely
})
```

### Bi-weekly Soccer Game
```typescript
createRecurringEvent({
  title: 'Bi-weekly Soccer Match',
  sport: 'soccer',
  recurrenceType: 'weeks',
  intervalValue: 2, // Every 2 weeks
  startTime: '14:00',
  duration: 120,
  startDate: '2025-11-17',
  endDate: '2026-06-30'
})
```

## Architecture Notes

- **Worker Entry Point**: `worker.ts` exports both the default fetch handler (for HTTP requests) and a `scheduled` handler (for cron jobs)
- **Database**: Drizzle ORM with SQLite (Turso)
- **Serverless Functions**: TanStack Start with Cloudflare Pages
- **Cron Execution**: Cloudflare Workers scheduled events

## Future Enhancements

Potential improvements to consider:

1. **More Recurrence Patterns**: Monthly on specific day, specific weekdays only
2. **Recurrence Exceptions**: Skip specific dates (holidays)
3. **Bulk Edit**: Update all future events from a recurring pattern
4. **Notification**: Notify organizers when events are auto-generated
5. **Analytics**: Track participation patterns for recurring events
