import { createFileRoute } from '@tanstack/react-router'
import { Discover } from '../pages/DiscoverPage'
import { getEvents, getVenues } from '../lib/server-functions'

export const Route = createFileRoute('/discover')({
  loader: async () => {
    // Load all events and venues - filtering will be done client-side for now
    const [events, venues] = await Promise.all([getEvents(), getVenues()])

    return {
      events,
      venues
    }
  },
  component: Discover
})
