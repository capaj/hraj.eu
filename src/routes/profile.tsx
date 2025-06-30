import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '../pages/ProfilePage'
import {
  getUserById,
  getUserNotifications,
  getEvents,
  getVenues,
  getUsers
} from '../lib/server-functions'

export const Route = createFileRoute('/profile')({
  loader: async () => {
    // For now, using a mock user ID - in real app this would come from auth
    const mockUserId = '1'
    const [user, notifications, events, venues, users] = await Promise.all([
      getUserById({ data: mockUserId }),
      getUserNotifications({ data: mockUserId }),
      getEvents(),
      getVenues(),
      getUsers()
    ])

    return {
      user,
      notifications,
      events,
      venues,
      users
    }
  },
  component: Profile
})
