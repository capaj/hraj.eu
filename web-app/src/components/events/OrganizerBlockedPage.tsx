import { Trans } from '@lingui/react/macro'
import { Link } from '@tanstack/react-router'
import { ShieldBan } from 'lucide-react'

export function OrganizerBlockedPage() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <ShieldBan size={28} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          <Trans>The organizer has blocked you.</Trans>
        </h1>
        <p className="mt-3 text-gray-600">
          <Trans>You cannot view or join this organizer’s events.</Trans>
        </p>
        <Link to="/discover" className="mt-6 inline-flex rounded-lg bg-primary-600 px-5 py-3 font-medium text-white hover:bg-primary-700">
          <Trans>Find other events</Trans>
        </Link>
      </div>
    </main>
  )
}
