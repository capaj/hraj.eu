import React, { useState, useEffect, useMemo } from 'react'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { getUsers } from '~/server-functions/getUsers'
import { User, Event } from '../types'
import { SPORTS } from '../lib/constants'
import { i18n } from '~/lib/i18n'
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Filter,
  ChevronDown
} from 'lucide-react'
import { UserAvatar } from '../components/user/UserAvatar'
import { useLoaderData } from '@tanstack/react-router'

type LeaderboardType =
  | 'karma'
  | 'events-organized'
  | 'events-joined'
  | 'monthly'

const MAX_LEADERBOARD_USERS = 25

export const Leaderboard: React.FC = () => {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('karma')
  const [selectedSport, setSelectedSport] = useState<string | undefined>(
    undefined
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const { events } = useLoaderData({ from: '/leaderboard' }) as { events: Event[] }

  const userStats = useMemo(() => {
    const stats = new Map<string, { eventsOrganized: number; eventsJoined: number; monthlyPoints: number }>()
    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)

    for (const event of events) {
      const eventDate = new Date(event.date)
      const isInSelectedSport = (sportId?: string) => !sportId || event.sport === sportId

      if (isInSelectedSport(selectedSport)) {
        const organizer = stats.get(event.organizerId) ?? { eventsOrganized: 0, eventsJoined: 0, monthlyPoints: 0 }
        organizer.eventsOrganized += 1
        if (eventDate >= monthStart) organizer.monthlyPoints += 10
        stats.set(event.organizerId, organizer)

        for (const participantId of event.participants) {
          const participant = stats.get(participantId) ?? { eventsOrganized: 0, eventsJoined: 0, monthlyPoints: 0 }
          participant.eventsJoined += 1
          if (eventDate >= monthStart) participant.monthlyPoints += 5
          stats.set(participantId, participant)
        }
      }
    }

    return stats
  }, [events, selectedSport])

  // Fetch users from server
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getUsers({ data: { limit: MAX_LEADERBOARD_USERS } })
        setUsers(usersData)
      } catch (error) {
        console.error('Failed to load users:', error)
      }
    }
    fetchUsers()
  }, [])

  // Generate leaderboard data
  const generateLeaderboardData = (type: LeaderboardType, sport?: string) => {
    let filteredUsers = [...users]

    // Filter by sport if selected
    if (sport) {
      filteredUsers = filteredUsers.filter((user) => user.skillLevels[sport])
    }

    switch (type) {
      case 'karma':
        return filteredUsers
          .sort((a, b) => b.karmaPoints - a.karmaPoints)
          .map((user) => ({
            ...user,
            score: user.karmaPoints,
            subtitle: i18n._(msg`{karmaPoints} karma points`.id, {
              karmaPoints: user.karmaPoints
            }),
            change: 0
          }))
          .sort((a, b) => b.score - a.score)

      case 'events-organized':
        return filteredUsers
          .map((user) => ({
            ...user,
            score: userStats.get(user.id)?.eventsOrganized ?? 0,
            subtitle: '',
            change: 0
          }))
          .sort((a, b) => b.score - a.score)
          .map((user) => ({
            ...user,
            subtitle: sport
              ? i18n._(msg`{count} {sportName} events organized`.id, {
                count: user.score,
                sportName: SPORTS.find((s) => s.id === sport)?.name ?? sport
              })
              : i18n._(msg`{count} events organized`.id, { count: user.score })
          }))

      case 'events-joined':
        return filteredUsers
          .map((user) => ({
            ...user,
            score: userStats.get(user.id)?.eventsJoined ?? 0,
            subtitle: '',
            change: 0
          }))
          .sort((a, b) => b.score - a.score)
          .map((user) => ({
            ...user,
            subtitle: sport
              ? i18n._(msg`{count} {sportName} events joined`.id, {
                count: user.score,
                sportName: SPORTS.find((s) => s.id === sport)?.name ?? sport
              })
              : i18n._(msg`{count} events joined`.id, { count: user.score })
          }))

      case 'monthly':
        return filteredUsers
          .map((user) => ({
            ...user,
            score: userStats.get(user.id)?.monthlyPoints ?? 0,
            subtitle: '',
            change: 0
          }))
          .sort((a, b) => b.score - a.score)
          .map((user) => ({
            ...user,
            subtitle: sport
              ? i18n._(msg`{count} points in {sportName} this month`.id, {
                count: user.score,
                sportName: SPORTS.find((s) => s.id === sport)?.name ?? sport
              })
              : i18n._(msg`{count} points this month`.id, { count: user.score })
          }))

      default:
        return filteredUsers.map((user) => ({
          ...user,
          score: 0,
          subtitle: '',
          change: 0
        }))
    }
  }

  const leaderboardData = generateLeaderboardData(selectedType, selectedSport)
  const displayedLeaderboardData = leaderboardData.slice(0, MAX_LEADERBOARD_USERS)

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />
      case 2:
        return <Medal className="text-gray-400" size={24} />
      case 3:
        return <Award className="text-amber-600" size={24} />
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            {position}
          </div>
        )
    }
  }

  const getRankBadgeVariant = (position: number) => {
    switch (position) {
      case 1:
        return 'warning' as const // Gold
      case 2:
        return 'default' as const // Silver
      case 3:
        return 'info' as const // Bronze
      default:
        return 'default' as const
    }
  }

  const getTypeIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'karma':
        return <Trophy size={16} />
      case 'events-organized':
        return <Target size={16} />
      case 'events-joined':
        return <Users size={16} />
      case 'monthly':
        return <Calendar size={16} />
    }
  }

  const getTypeTitle = (type: LeaderboardType) => {
    switch (type) {
      case 'karma':
        return i18n._(msg`Overall Karma`)
      case 'events-organized':
        return i18n._(msg`Events Organized`)
      case 'events-joined':
        return i18n._(msg`Events Joined`)
      case 'monthly':
        return i18n._(msg`This Month`)
    }
  }

  const getTypeDescription = (type: LeaderboardType) => {
    const sportName = selectedSport
      ? SPORTS.find((s) => s.id === selectedSport)?.name
      : ''

    switch (type) {
      case 'karma':
        return sportName
          ? selectedSport
            ? i18n._(msg`{sportName} - Top players by sport-specific karma points earned`.id, {
              sportName
            })
            : i18n._(msg`{sportName} - Top players by total karma points earned`.id, {
              sportName
            })
          : selectedSport
            ? i18n._(msg`Top players by sport-specific karma points earned`)
            : i18n._(msg`Top players by total karma points earned`)
      case 'events-organized':
        return sportName
          ? i18n._(msg`{sportName} - Most active event organizers`.id, { sportName })
          : i18n._(msg`Most active event organizers`)
      case 'events-joined':
        return sportName
          ? i18n._(msg`{sportName} - Most active participants`.id, { sportName })
          : i18n._(msg`Most active participants`)
      case 'monthly':
        return sportName
          ? i18n._(msg`{sportName} - Top performers this month`.id, { sportName })
          : i18n._(msg`Top performers this month`)
    }
  }

  const getSkillLevelForSport = (user: any, sport: string) => {
    const level = user.skillLevels[sport]
    if (!level) return null

    const levelColors: Record<'beginner' | 'intermediate' | 'advanced', string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant="default" size="sm" className={levelColors[level as keyof typeof levelColors]}>
        {level}
      </Badge>
    )
  }

  const selectedSportInfo = selectedSport
    ? SPORTS.find((s) => s.id === selectedSport)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
            <Trophy className="text-yellow-400 mr-3" size={32} />
            <Trans>Community Leaderboard</Trans>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            <Trans>
              Celebrate our most active community members and see how you rank
              among fellow sports enthusiasts
            </Trans>
          </p>
        </div>

        {/* Compact Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Leaderboard Type Selector - More Compact */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                <Trans>Leaderboard Categories</Trans>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    'karma',
                    'events-organized',
                    'events-joined',
                    'monthly'
                  ] as LeaderboardType[]
                ).map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="flex items-center justify-center text-xs py-2"
                  >
                    {getTypeIcon(type)}
                    <span className="ml-1 hidden sm:inline">
                      {getTypeTitle(type)}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sport Filter - Dropdown */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center">
                <Filter size={16} className="mr-2" />
                <Trans>Filter by Sport</Trans>
              </h3>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  <span className="flex items-center">
                    {selectedSportInfo ? (
                      <>
                        <span className="mr-2">{selectedSportInfo.icon}</span>
                        <span className="truncate">
                          {selectedSportInfo.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🏆</span>
                        <span>
                          <Trans>All Sports</Trans>
                        </span>
                      </>
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedSport(undefined)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${!selectedSport ? 'bg-primary-50 text-primary-700' : ''
                        }`}
                    >
                      <span className="mr-2">🏆</span>
                      <span>
                        <Trans>All Sports</Trans>
                      </span>
                    </button>
                    {SPORTS.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => {
                          setSelectedSport(sport.id)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${selectedSport === sport.id
                          ? 'bg-primary-50 text-primary-700'
                          : ''
                          }`}
                      >
                        <span className="mr-2">{sport.icon}</span>
                        <span className="truncate">{sport.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  {getTypeIcon(selectedType)}
                  <span className="ml-2">
                    {i18n._(msg`{title} Leaderboard`.id, {
                      title: getTypeTitle(selectedType)
                    })}
                  </span>
                  {selectedSport && (
                    <span className="ml-2 text-lg">
                      {SPORTS.find((s) => s.id === selectedSport)?.icon}
                    </span>
                  )}
                </h2>
                <p className="text-gray-600 mt-1">
                  {getTypeDescription(selectedType)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedSport && (
                  <Badge variant="info" size="md" className="flex items-center">
                    {SPORTS.find((s) => s.id === selectedSport)?.icon}
                    <span className="ml-1">
                      {SPORTS.find((s) => s.id === selectedSport)?.name}
                    </span>
                  </Badge>
                )}
                <Badge variant="default" size="md">
                  <Trans>Updated daily</Trans>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {displayedLeaderboardData.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {displayedLeaderboardData.map((user, index) => {
                  const position = index + 1
                  const isTopThree = position <= 3

                  return (
                    <div
                      key={user.id}
                      className={`p-6 transition-colors hover:bg-gray-50 ${isTopThree
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                        : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className="flex items-center justify-center w-12">
                            {getRankIcon(position)}
                          </div>

                          {/* User Info */}
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              user={user}
                              className={`w-12 h-12 ${isTopThree ? 'ring-2 ring-yellow-400' : ''
                                }`}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">
                                  {user.name}
                                </h3>
                                {position <= 3 && (
                                  <Badge
                                    variant={getRankBadgeVariant(position)}
                                    size="sm"
                                  >
                                    {position === 1
                                      ? '🥇'
                                      : position === 2
                                        ? '🥈'
                                        : '🥉'}
                                  </Badge>
                                )}
                                {selectedSport &&
                                  getSkillLevelForSport(user, selectedSport)}
                              </div>
                              <p className="text-sm text-gray-600">
                                {user.subtitle}
                              </p>

                              {/* User's sports - show all if no sport filter, or highlight selected sport */}
                              <div className="flex items-center space-x-1 mt-1">
                                {selectedSport ? (
                                  // Show only the selected sport with skill level
                                  <div className="flex items-center space-x-1">
                                    <span
                                      className="text-sm"
                                      title={
                                        SPORTS.find(
                                          (s) => s.id === selectedSport
                                        )?.name
                                      }
                                    >
                                      {
                                        SPORTS.find(
                                          (s) => s.id === selectedSport
                                        )?.icon
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  // Show all sports
                                  Object.keys(user.skillLevels)
                                    .slice(0, 3)
                                    .map((sport) => {
                                      const sportInfo = SPORTS.find(
                                        (s) => s.id === sport
                                      )
                                      return (
                                        <span
                                          key={sport}
                                          className="text-xs"
                                          title={sportInfo?.name}
                                        >
                                          {sportInfo?.icon}
                                        </span>
                                      )
                                    })
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Score and Change */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {user.score.toLocaleString()}
                          </div>
                          {user.change !== 0 && (
                            <div
                              className={`flex items-center text-sm ${user.change > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}
                            >
                              <TrendingUp
                                size={14}
                                className={`mr-1 ${user.change < 0 ? 'rotate-180' : ''
                                  }`}
                              />
                              {user.change > 0 ? '+' : ''}
                              {user.change}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Trophy size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  <Trans>No players found</Trans>
                </h3>
                <p className="text-gray-600 mb-4">
                  <Trans>
                    No players have skill levels recorded for{' '}
                    {SPORTS.find((s) => s.id === selectedSport)?.name ?? ''}.
                  </Trans>
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSport(undefined)}
                >
                  <Trans>View All Sports</Trans>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {displayedLeaderboardData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Crown className="text-yellow-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {displayedLeaderboardData[0]?.name || i18n._(msg`N/A`)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSport
                    ? i18n._(msg`{sportName} Champion`.id, {
                      sportName:
                        SPORTS.find((s) => s.id === selectedSport)?.name ??
                        ''
                    })
                    : i18n._(msg`Current Champion`)}
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {displayedLeaderboardData.length}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSport
                    ? i18n._(msg`{sportName} Players`.id, {
                      sportName:
                        SPORTS.find((s) => s.id === selectedSport)?.name ??
                        ''
                    })
                    : i18n._(msg`Active Players`)}
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(
                    displayedLeaderboardData.reduce((sum, user) => sum + user.score, 0) /
                      displayedLeaderboardData.length
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <Trans>Average Score</Trans>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How Karma Works */}
        <Card className="mt-8">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              <Trans>How Karma Points Work</Trans>
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-green-700">
                  <Trans>Earn Points For:</Trans>
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    <Trans>Organizing successful events (+10 points)</Trans>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    <Trans>Attending events (+5 points)</Trans>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    <Trans>Positive feedback from players (+3 points)</Trans>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    <Trans>Helping new players (+2 points)</Trans>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-red-700">
                  <Trans>Lose Points For:</Trans>
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">-</span>
                    <Trans>No-shows without notice (-5 points)</Trans>
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">-</span>
                    <Trans>Canceling events last minute (-3 points)</Trans>
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">-</span>
                    <Trans>Negative behavior reports (-10 points)</Trans>
                  </li>
                </ul>
              </div>
            </div>

            {selectedSport && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    {SPORTS.find((s) => s.id === selectedSport)?.icon}
                    <span className="ml-2">
                      <Trans>Sport-Specific Rankings</Trans>
                    </span>
                  </h4>
                  <p className="text-sm text-blue-800">
                    <Trans>
                      When filtering by{' '}
                      {SPORTS.find((s) => s.id === selectedSport)?.name ?? ''},
                      rankings show karma points and activities specifically
                      related to this sport. Only players with recorded skill
                      levels in this sport are included in the rankings.
                    </Trans>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}
