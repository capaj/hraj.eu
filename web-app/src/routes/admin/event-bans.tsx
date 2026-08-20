import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '~/lib/auth-client'
import { AdminEventBansPage } from '~/pages/AdminEventBansPage'

export const Route = createFileRoute('/admin/event-bans')({
  component: () => (
    <ProtectedRoute>
      <AdminEventBansPage />
    </ProtectedRoute>
  )
})
