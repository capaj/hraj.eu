import { createFileRoute } from '@tanstack/react-router'
import { Leaderboard } from '../pages/LeaderboardPage'
import { getEvents } from '~/server-functions/getEvents'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

const title = `Amateur sports leaderboard | ${SITE_NAME}`
const description =
  'See active amateur players and organizers on hraj.eu. Find people who play local team sports and join the community leaderboard.'

export const Route = createFileRoute('/leaderboard')({
  loader: async () => {
    // Load all events and users for leaderboard calculations
    const events = await getEvents()
    return { events }
  },
  head: () => ({
    meta: buildSeoMeta({
      title,
      description,
      url: `${SITE_URL}/leaderboard`
    }),
    links: [canonicalLink('/leaderboard')]
  }),
  component: Leaderboard
})
