import { createFileRoute } from '@tanstack/react-router'
import { UserProfile } from '../pages/UserProfilePage'
import { ProtectedRoute } from '~/lib/auth-client'

export const Route = createFileRoute('/user-profile')({
  component: () => {
    return (
      <ProtectedRoute>
        <UserProfile />
      </ProtectedRoute>
    )
  }
})
