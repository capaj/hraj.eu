import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '../pages/HomePage'
import { getUpcomingEvents } from '~/server-functions/getUpcomingEvents'
import { getAppStats } from '~/server-functions/getAppStats'

export const Route = createFileRoute('/about')({
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
  component: HomePage
})
