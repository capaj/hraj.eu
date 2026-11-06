import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import { ChevronDown, User } from 'lucide-react'
import { CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'

export function EventPlayersHeader({ expanded, onToggle, blockAction, showRating = false }: {
  expanded: boolean
  onToggle: () => void
  blockAction?: ReactNode
  showRating?: boolean
}) {
  return (
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          <button type="button" onClick={onToggle} aria-expanded={expanded}
            className="flex items-center rounded focus-visible:outline-2 focus-visible:outline-primary-600 lg:cursor-default">
            <User size={18} className="mr-2" aria-hidden="true" />
            <Trans>Who's Playing</Trans>
            <ChevronDown size={20} aria-hidden="true"
              className={`ml-2 transition-transform duration-200 lg:hidden ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </h3>
        {blockAction}
        {showRating && <Badge variant="info" size="sm"><Trans>Rate Players</Trans></Badge>}
      </div>
    </CardHeader>
  )
}
