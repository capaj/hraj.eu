import { createFileRoute } from '@tanstack/react-router'
import { DiscoverPage } from '../pages/DiscoverPage'
import { getEvents } from '~/server-functions/getEvents'
import { getVenues } from '~/server-functions/getVenues'
import { getUserById } from '~/server-functions/getUserById'
import { authClient } from '~/lib/auth-client'

export const Route = createFileRoute('/')({
  loader: async () => {
    // Load all events and venues - filtering will be done client-side for now
    const session = await authClient.getSession()
    const [events, venues] = await Promise.all([getEvents(), getVenues()])

    let user = null
    if (session.data?.user) {
      user = await getUserById({ data: session.data.user.id })
    }

    return { events, venues, user }
  },
  component: DiscoverPage
})
