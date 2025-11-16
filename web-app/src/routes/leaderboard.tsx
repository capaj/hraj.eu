import { createFileRoute } from '@tanstack/react-router'
import { Leaderboard } from '../pages/LeaderboardPage'
import { getEvents } from '~/server-functions/getEvents'

export const Route = createFileRoute('/leaderboard')({
  loader: async () => {
    // Load all events and users for leaderboard calculations
    const events = await getEvents()
    return { events }
  },
  component: Leaderboard
})
