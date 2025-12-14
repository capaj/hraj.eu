import React, { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'

interface EventFiltersProps {
  selectedSport?: string
  selectedSkillLevel?: string
  onSportChange: (sport?: string) => void
  onSkillLevelChange: (level?: string) => void
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  selectedSport,
  selectedSkillLevel,
  onSportChange,
  onSkillLevelChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const selectedSportName = selectedSport
    ? SPORTS.find(s => s.id === selectedSport)?.name
    : 'All Sports'

  const selectedLevelName = selectedSkillLevel
    ? SKILL_LEVELS.find(l => l.id === selectedSkillLevel)?.name
    : 'All Levels'

  return (
    <Card className="mb-6 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {!isExpanded && (
              <p className="text-sm text-gray-500">
                {selectedSportName} • {selectedLevelName}
              </p>
            )}
          </div>
        </div>
        <button
          className="text-gray-400 hover:text-primary-600 transition-colors"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <CardContent className="p-6 pt-0 border-t border-gray-100 mt-4">
          {/* Sports Filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Sport</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSportChange(undefined)
                }}
                className="cursor-pointer"
              >
                <Badge variant={!selectedSport ? 'info' : 'default'}>
                  All Sports
                </Badge>
              </button>
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSportChange(sport.id)
                  }}
                  className="cursor-pointer"
                >
                  <Badge
                    variant={selectedSport === sport.id ? 'info' : 'default'}
                  >
                    {sport.icon} {sport.name}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Skill Level
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSkillLevelChange(undefined)
                }}
                className="cursor-pointer"
              >
                <Badge variant={!selectedSkillLevel ? 'info' : 'default'}>
                  All Levels
                </Badge>
              </button>
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSkillLevelChange(level.id)
                  }}
                  className="cursor-pointer"
                >
                  <Badge
                    variant={selectedSkillLevel === level.id ? 'info' : 'default'}
                  >
                    {level.name}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
