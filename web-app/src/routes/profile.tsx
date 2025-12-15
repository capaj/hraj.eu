import { createFileRoute } from '@tanstack/react-router'
import { PublicProfilePage } from '../pages/PublicProfilePage'
import { getUserById } from '~/server-functions/getUserById'
import { getUserNotifications } from '~/server-functions/getUserNotifications'
import { getEvents } from '~/server-functions/getEvents'
import { getVenues } from '~/server-functions/getVenues'
import { getUsers } from '~/server-functions/getUsers'
import { ProtectedRoute } from '~/lib/auth-client'

export const Route = createFileRoute('/profile')({
  loader: async () => {
    // For now, using a mock user ID - in real app this would come from auth
    const mockUserId = '1'
    const [notifications, events, venues, users] = await Promise.all([
      getUserNotifications({ data: mockUserId }),
      getEvents(),
      getVenues(),
      getUsers()
    ])

    return {
      notifications,
      events,
      venues,
      users
    }
  },
  component: () => {
    return (
      <ProtectedRoute>
        <PublicProfilePage />
      </ProtectedRoute>
    )
  }
})
