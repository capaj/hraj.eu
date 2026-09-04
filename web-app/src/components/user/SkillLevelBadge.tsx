import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { cn } from '~/lib/utils'
import type { SkillLevel } from '~/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip'

const LEVEL_STYLES: Record<SkillLevel, string> = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500'
}

function getLevelCopy(level: SkillLevel) {
  switch (level) {
    case 'beginner':
      return {
        abbreviation: 'B',
        label: i18n._(msg`Beginner`),
        description: i18n._(msg`New to the sport or casual players`)
      }
    case 'intermediate':
      return {
        abbreviation: 'I',
        label: i18n._(msg`Intermediate`),
        description: i18n._(msg`Regular players with some experience`)
      }
    case 'advanced':
      return {
        abbreviation: 'A',
        label: i18n._(msg`Advanced`),
        description: i18n._(msg`Experienced competitive players`)
      }
  }
}

interface SkillLevelBadgeProps {
  level: SkillLevel
  className?: string
}

export function SkillLevelBadge({ level, className }: SkillLevelBadgeProps) {
  const { abbreviation, label, description } = getLevelCopy(level)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex size-6 shrink-0 cursor-help items-center justify-center rounded-full text-xs font-bold leading-none text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
            LEVEL_STYLES[level],
            className
          )}
          aria-label={`${label}: ${description}`}
        >
          {abbreviation}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-56">
        <span className="block font-semibold">{label}</span>
        <span className="block opacity-80">{description}</span>
      </TooltipContent>
    </Tooltip>
  )
}
