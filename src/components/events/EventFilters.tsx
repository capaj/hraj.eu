import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SPORTS, SKILL_LEVELS } from '../../lib/constants';

interface EventFiltersProps {
  selectedSport?: string;
  selectedSkillLevel?: string;
  onSportChange: (sport?: string) => void;
  onSkillLevelChange: (level?: string) => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  selectedSport,
  selectedSkillLevel,
  onSportChange,
  onSkillLevelChange,
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">

        
        {/* Sports Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sport</h4>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!selectedSport ? 'info' : 'default'}
              className="cursor-pointer"
              onClick={() => onSportChange(undefined)}
            >
              All Sports
            </Badge>
            {SPORTS.map((sport) => (
              <Badge
                key={sport.id}
                variant={selectedSport === sport.id ? 'info' : 'default'}
                className="cursor-pointer"
                onClick={() => onSportChange(sport.id)}
              >
                {sport.icon} {sport.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Skill Level Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Skill Level</h4>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!selectedSkillLevel ? 'info' : 'default'}
              className="cursor-pointer"
              onClick={() => onSkillLevelChange(undefined)}
            >
              All Levels
            </Badge>
            {SKILL_LEVELS.map((level) => (
              <Badge
                key={level.id}
                variant={selectedSkillLevel === level.id ? 'info' : 'default'}
                className="cursor-pointer"
                onClick={() => onSkillLevelChange(level.id)}
              >
                {level.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};