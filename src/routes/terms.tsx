import { createFileRoute } from '@tanstack/react-router'
import { TermsOfService } from '../pages/TOSPage'

export const Route = createFileRoute('/terms')({
  component: TermsOfService
})
