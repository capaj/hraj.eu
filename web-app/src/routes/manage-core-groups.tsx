import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '~/lib/auth-client'
import { ManageCoreGroupsPage } from '~/pages/ManageCoreGroupsPage'

export const Route = createFileRoute('/manage-core-groups')({
  component: () => (
    <ProtectedRoute>
      <ManageCoreGroupsPage />
    </ProtectedRoute>
  )
})
