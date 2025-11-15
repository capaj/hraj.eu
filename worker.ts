// Custom worker entry point that handles both fetch and scheduled events
import { generateRecurringEvents } from './src/lib/generate-recurring-events'

// Import the TanStack Start server entry for handling fetch requests
// @ts-ignore - This module is resolved at build time
import serverEntry from '@tanstack/react-start/server-entry'

export interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  [key: string]: any
}

// Export the fetch handler from TanStack Start
export default serverEntry

// Export scheduled handler for cron jobs
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  event,
  env,
  ctx
) => {
  console.log('Scheduled job triggered at:', new Date(event.scheduledTime).toISOString())

  try {
    // Generate recurring events (2 weeks in advance)
    const result = await generateRecurringEvents()

    console.log('Scheduled job completed successfully:', result)
  } catch (error) {
    console.error('Error in scheduled job:', error)
    throw error
  }
}
