import React, { useState } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'
import { Filter, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'

interface EventFiltersProps {
  selectedSports: string[]
  selectedSkillLevel?: string
  onSportToggle: (sportId: string) => void
  onSkillLevelChange: (level?: string) => void
  onClearSports: () => void
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  selectedSports,
  selectedSkillLevel,
  onSportToggle,
  onSkillLevelChange,
  onClearSports
}) => {
  const selectedLevelName = selectedSkillLevel
    ? SKILL_LEVELS.find(l => l.id === selectedSkillLevel)?.name
    : 'All Levels'

  const activeFiltersCount = selectedSports.length + (selectedSkillLevel ? 1 : 0)

  return (
    <div className="mb-6 flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <Filter size={16} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-4" align="start">
          {/* Sports Filter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <DropdownMenuLabel className="px-0">Sport</DropdownMenuLabel>
              {selectedSports.length > 0 && (
                <button
                  onClick={onClearSports}
                  className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport.id)
                return (
                  <button
                    key={sport.id}
                    onClick={() => onSportToggle(sport.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                      isSelected
                        ? "bg-primary-50 border-primary-200 text-primary-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    )}
                  >
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Skill Level Filter */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <DropdownMenuLabel className="px-0">Skill Level</DropdownMenuLabel>
              {selectedSkillLevel && (
                <button
                  onClick={() => onSkillLevelChange(undefined)}
                  className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => onSkillLevelChange(
                    selectedSkillLevel === level.id ? undefined : level.id
                  )}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                    selectedSkillLevel === level.id
                      ? "bg-primary-50 border-primary-200 text-primary-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2">
        {selectedSports.map(sportId => {
          const sport = SPORTS.find(s => s.id === sportId)
          if (!sport) return null
          return (
            <Badge key={sportId} variant="info" className="flex items-center gap-1 pl-2 pr-1 py-1">
              {sport.icon} {sport.name}
              <button onClick={() => onSportToggle(sportId)} className="hover:bg-blue-200 rounded-full p-0.5 ml-1">
                <X size={12} />
              </button>
            </Badge>
          )
        })}
        {selectedSkillLevel && (
          <Badge variant="info" className="flex items-center gap-1 pl-2 pr-1 py-1">
            {selectedLevelName}
            <button onClick={() => onSkillLevelChange(undefined)} className="hover:bg-blue-200 rounded-full p-0.5 ml-1">
              <X size={12} />
            </button>
          </Badge>
        )}
      </div>
    </div>
  )
}
