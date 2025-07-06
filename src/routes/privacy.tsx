import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPolicy } from '../pages/PrivacyPage'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicy
})
