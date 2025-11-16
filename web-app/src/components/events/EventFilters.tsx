import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'

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
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Sports Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sport</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSportChange(undefined)}
              className="cursor-pointer"
            >
              <Badge variant={!selectedSport ? 'info' : 'default'}>
                All Sports
              </Badge>
            </button>
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => onSportChange(sport.id)}
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
              onClick={() => onSkillLevelChange(undefined)}
              className="cursor-pointer"
            >
              <Badge variant={!selectedSkillLevel ? 'info' : 'default'}>
                All Levels
              </Badge>
            </button>
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => onSkillLevelChange(level.id)}
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
    </Card>
  )
}
