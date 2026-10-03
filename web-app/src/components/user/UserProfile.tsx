import { useLingui } from '@lingui/react'
import { i18n } from '~/lib/i18n'
import { getSkillLevelName, getSportName } from '~/lib/localizedNames'
import { Trans } from '@lingui/react/macro'
import React from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { User } from '../../types'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'
import { Trophy, Calendar } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { SportIcon } from '../sports/SportIcon'

interface UserProfileProps {
  user: User
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  useLingui()

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <UserAvatar user={user} className="w-16 h-16" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            {user.karmaPoints !== undefined && (
              <div className="flex items-center mt-2">
                <Trophy size={16} className="text-yellow-500 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  <Trans>{user.karmaPoints} karma</Trans>
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {user.bio && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2"><Trans>About me</Trans></h3>
            <p className="text-gray-700">{user.bio}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3"><Trans>Skill Levels</Trans></h3>
          <div className="space-y-2">
            {Object.entries(user.skillLevels || {}).map(([sport, level]) => {
              const sportInfo = SPORTS.find((s) => s.id === sport)
              const levelInfo = SKILL_LEVELS.find((l) => l.id === level)
              let badgeVariant: 'success' | 'warning' | 'error' = 'error'
              if (level === 'beginner') {
                badgeVariant = 'success'
              } else if (level === 'intermediate') {
                badgeVariant = 'warning'
              }

              return (
                <div key={sport} className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-700">
                    <SportIcon sport={sport} size={16} className="mr-1.5" />
                    {(sportInfo ? getSportName(sportInfo.id) : undefined) ?? sport}
                  </span>
                  <Badge variant={badgeVariant}>
                    {(levelInfo ? getSkillLevelName(levelInfo.id) : undefined)}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>


        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          <Trans>Member since</Trans>{' '}
          {user.createdAt.toLocaleDateString(i18n.locale, {
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </CardContent>
    </Card>
  )
}
