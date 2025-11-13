import { createFileRoute } from '@tanstack/react-router'
import { ManageVenuesPage } from '../pages/ManageVenuesPage'
import { ProtectedRoute } from '~/lib/auth-client'

export const Route = createFileRoute('/manage-venues')({
  component: () => {
    return (
      <ProtectedRoute>
        <ManageVenuesPage />
      </ProtectedRoute>
    )
  }
})
