import React from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { User } from 'better-auth'
import { SPORTS, SKILL_LEVELS } from '../../lib/constants'
import { Trophy, Calendar, Star } from 'lucide-react'

interface UserProfileProps {
  user: User
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const skillLevels = { handball: 'intermediate', 'water-polo': 'beginner' }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <img
            src={user.image ?? undefined}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-2">
              <Trophy size={16} className="text-yellow-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                {user.karmaPoints} karma
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {user.bio && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700">{user.bio}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Skill Levels</h3>
          <div className="space-y-2">
            {Object.entries(skillLevels).map(([sport, level]) => {
              const sportInfo = SPORTS.find((s) => s.id === sport)
              const levelInfo = SKILL_LEVELS.find((l) => l.id === level)
              return (
                <div key={sport} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {sportInfo?.icon} {sportInfo?.name}
                  </span>
                  <Badge
                    variant={
                      level === 'beginner'
                        ? 'success'
                        : level === 'intermediate'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {levelInfo?.name}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Star size={16} className="text-primary-600 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700 block">
                  Joined <strong>Sunday Football at Letná Park</strong>
                </span>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700 block">
                  Created <strong>Morning Basketball</strong>
                </span>
                <span className="text-xs text-gray-500">3 days ago</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700 block">
                  Received karma from tennis match
                </span>
                <span className="text-xs text-gray-500">1 week ago</span>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700 block">
                  Saved <strong>Ice Hockey Pick-up Game</strong>
                </span>
                <span className="text-xs text-gray-500">1 week ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          Member since{' '}
          {user.createdAt.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </CardContent>
    </Card>
  )
}
