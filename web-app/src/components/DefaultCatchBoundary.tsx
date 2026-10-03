import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { getLocalizedErrorMessage } from '~/lib/errorMessages'
import { Trans } from '@lingui/react/macro'
import { useLingui } from '@lingui/react'
import {
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  useLingui()
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <div role="alert" className="text-center">
        <h2 className="text-xl font-semibold text-gray-900"><Trans>Something went wrong</Trans></h2>
        <p className="mt-2 text-gray-600">
          {getLocalizedErrorMessage(error, i18n._(msg`Please try again or return to the home page.`))}
        </p>
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            router.invalidate()
          }}
          className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
        >
          <Trans>Try Again</Trans>
        </button>
        {isRoot ? (
          <Link
            to="/"
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
          >
            <Trans>Home</Trans>
          </Link>
        ) : (
          <Link
            to="/"
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            <Trans>Go Back</Trans>
          </Link>
        )}
      </div>
    </div>
  )
}
