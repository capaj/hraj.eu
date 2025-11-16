import { createFileRoute } from '@tanstack/react-router'
import { Home } from '../pages/HomePage'
import { getUpcomingEvents, getAppStats } from '../lib/server-functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    // Load data for home page - upcoming events and stats
    const [upcomingEvents, stats] = await Promise.all([
      getUpcomingEvents({ data: 3 }),
      getAppStats()
    ])

    return {
      upcomingEvents,
      stats
    }
  },
  component: Home
})
