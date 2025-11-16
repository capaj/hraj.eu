import { createFileRoute } from '@tanstack/react-router'
import { CreateEvent } from '../pages/CreateEventPage'
import { getVenues } from '../lib/server-functions'

export const Route = createFileRoute('/create')({
  loader: async () => {
    // Load venues for the create event form
    const venues = await getVenues()
    return { venues }
  },
  component: CreateEvent
})
