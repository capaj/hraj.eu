import { createFileRoute } from '@tanstack/react-router'
import { UserProfile } from '../pages/UserProfilePage'

export const Route = createFileRoute('/user-profile')({
  component: UserProfile
})
