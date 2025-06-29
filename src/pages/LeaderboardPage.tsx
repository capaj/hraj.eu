import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockUsers } from '../lib/mock-data';
import { SPORTS } from '../lib/constants';
import { Trophy, Medal, Award, Crown, TrendingUp, Calendar, Users, Target, Filter, ChevronDown } from 'lucide-react';

type LeaderboardType = 'karma' | 'events-organized' | 'events-joined' | 'monthly';

export const Leaderboard: React.FC = () => {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('karma');
  const [selectedSport, setSelectedSport] = useState<string | undefined>(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Generate mock leaderboard data
  const generateLeaderboardData = (type: LeaderboardType, sport?: string) => {
    let users = [...mockUsers];
    
    // Filter by sport if selected
    if (sport) {
      users = users.filter(user => user.skillLevels[sport]);
    }
    
    switch (type) {
      case 'karma':
        return users
          .sort((a, b) => b.karmaPoints - a.karmaPoints)
          .map((user, index) => ({
            ...user,
            score: sport ? Math.floor(user.karmaPoints * 0.7) + Math.floor(Math.random() * 20) : user.karmaPoints,
            subtitle: sport 
              ? `${Math.floor(user.karmaPoints * 0.7) + Math.floor(Math.random() * 20)} karma in ${SPORTS.find(s => s.id === sport)?.name}`
              : `${user.karmaPoints} karma points`,
            change: Math.floor(Math.random() * 20) - 10,
          }))
          .sort((a, b) => b.score - a.score);
      
      case 'events-organized':
        return users
          .map(user => ({
            ...user,
            score: Math.floor(Math.random() * 15) + 1,
            subtitle: '',
            change: Math.floor(Math.random() * 6) - 3,
          }))
          .sort((a, b) => b.score - a.score)
          .map((user, index) => ({
            ...user,
            subtitle: sport 
              ? `${user.score} ${SPORTS.find(s => s.id === sport)?.name} events organized`
              : `${user.score} events organized`,
          }));
      
      case 'events-joined':
        return users
          .map(user => ({
            ...user,
            score: Math.floor(Math.random() * 25) + 5,
            subtitle: '',
            change: Math.floor(Math.random() * 8) - 4,
          }))
          .sort((a, b) => b.score - a.score)
          .map((user, index) => ({
            ...user,
            subtitle: sport 
              ? `${user.score} ${SPORTS.find(s => s.id === sport)?.name} events joined`
              : `${user.score} events joined`,
          }));
      
      case 'monthly':
        return users
          .map(user => ({
            ...user,
            score: Math.floor(Math.random() * 50) + 10,
            subtitle: '',
            change: Math.floor(Math.random() * 15) - 7,
          }))
          .sort((a, b) => b.score - a.score)
          .map((user, index) => ({
            ...user,
            subtitle: sport 
              ? `${user.score} points in ${SPORTS.find(s => s.id === sport)?.name} this month`
              : `${user.score} points this month`,
          }));
      
      default:
        return users.map(user => ({ ...user, score: 0, subtitle: '', change: 0 }));
    }
  };

  const leaderboardData = generateLeaderboardData(selectedType, selectedSport);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-amber-600" size={24} />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            {position}
          </div>
        );
    }
  };

  const getRankBadgeVariant = (position: number) => {
    switch (position) {
      case 1: return 'warning' as const; // Gold
      case 2: return 'default' as const; // Silver
      case 3: return 'info' as const; // Bronze
      default: return 'default' as const;
    }
  };

  const getTypeIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'karma': return <Trophy size={16} />;
      case 'events-organized': return <Target size={16} />;
      case 'events-joined': return <Users size={16} />;
      case 'monthly': return <Calendar size={16} />;
    }
  };

  const getTypeTitle = (type: LeaderboardType) => {
    switch (type) {
      case 'karma': return 'Overall Karma';
      case 'events-organized': return 'Events Organized';
      case 'events-joined': return 'Events Joined';
      case 'monthly': return 'This Month';
    }
  };

  const getTypeDescription = (type: LeaderboardType) => {
    const sportName = selectedSport ? SPORTS.find(s => s.id === selectedSport)?.name : '';
    const sportPrefix = sportName ? `${sportName} - ` : '';
    
    switch (type) {
      case 'karma': return `${sportPrefix}Top players by ${selectedSport ? 'sport-specific' : 'total'} karma points earned`;
      case 'events-organized': return `${sportPrefix}Most active event organizers`;
      case 'events-joined': return `${sportPrefix}Most active participants`;
      case 'monthly': return `${sportPrefix}Top performers this month`;
    }
  };

  const getSkillLevelForSport = (user: any, sport: string) => {
    const level = user.skillLevels[sport];
    if (!level) return null;
    
    const levelColors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="default" size="sm" className={levelColors[level]}>
        {level}
      </Badge>
    );
  };

  const selectedSportInfo = selectedSport ? SPORTS.find(s => s.id === selectedSport) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
            <Trophy className="text-yellow-400 mr-3" size={32} />
            Community Leaderboard
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Celebrate our most active community members and see how you rank among fellow sports enthusiasts
          </p>
        </div>

        {/* Compact Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Leaderboard Type Selector - More Compact */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Leaderboard Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['karma', 'events-organized', 'events-joined', 'monthly'] as LeaderboardType[]).map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="flex items-center justify-center text-xs py-2"
                  >
                    {getTypeIcon(type)}
                    <span className="ml-1 hidden sm:inline">{getTypeTitle(type)}</span>
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
                Filter by Sport
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
                        <span className="truncate">{selectedSportInfo.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🏆</span>
                        <span>All Sports</span>
                      </>
                    )}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedSport(undefined);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${
                        !selectedSport ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <span className="mr-2">🏆</span>
                      <span>All Sports</span>
                    </button>
                    {SPORTS.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => {
                          setSelectedSport(sport.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${
                          selectedSport === sport.id ? 'bg-primary-50 text-primary-700' : ''
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
                  <span className="ml-2">{getTypeTitle(selectedType)} Leaderboard</span>
                  {selectedSport && (
                    <span className="ml-2 text-lg">
                      {SPORTS.find(s => s.id === selectedSport)?.icon}
                    </span>
                  )}
                </h2>
                <p className="text-gray-600 mt-1">{getTypeDescription(selectedType)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedSport && (
                  <Badge variant="info" size="md" className="flex items-center">
                    {SPORTS.find(s => s.id === selectedSport)?.icon}
                    <span className="ml-1">{SPORTS.find(s => s.id === selectedSport)?.name}</span>
                  </Badge>
                )}
                <Badge variant="default" size="md">
                  Updated daily
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboardData.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {leaderboardData.map((user, index) => {
                  const position = index + 1;
                  const isTopThree = position <= 3;
                  
                  return (
                    <div
                      key={user.id}
                      className={`p-6 transition-colors hover:bg-gray-50 ${
                        isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
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
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className={`w-12 h-12 rounded-full object-cover ${
                                isTopThree ? 'ring-2 ring-yellow-400' : ''
                              }`}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                {position <= 3 && (
                                  <Badge variant={getRankBadgeVariant(position)} size="sm">
                                    {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                                  </Badge>
                                )}
                                {selectedSport && getSkillLevelForSport(user, selectedSport)}
                              </div>
                              <p className="text-sm text-gray-600">{user.subtitle}</p>
                              
                              {/* User's sports - show all if no sport filter, or highlight selected sport */}
                              <div className="flex items-center space-x-1 mt-1">
                                {selectedSport ? (
                                  // Show only the selected sport with skill level
                                  <div className="flex items-center space-x-1">
                                    <span className="text-sm" title={SPORTS.find(s => s.id === selectedSport)?.name}>
                                      {SPORTS.find(s => s.id === selectedSport)?.icon}
                                    </span>
                                  </div>
                                ) : (
                                  // Show all sports
                                  Object.keys(user.skillLevels).slice(0, 3).map(sport => {
                                    const sportInfo = SPORTS.find(s => s.id === sport);
                                    return (
                                      <span key={sport} className="text-xs" title={sportInfo?.name}>
                                        {sportInfo?.icon}
                                      </span>
                                    );
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
                            <div className={`flex items-center text-sm ${
                              user.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <TrendingUp 
                                size={14} 
                                className={`mr-1 ${user.change < 0 ? 'rotate-180' : ''}`} 
                              />
                              {user.change > 0 ? '+' : ''}{user.change}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Trophy size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-600 mb-4">
                  No players have skill levels recorded for {SPORTS.find(s => s.id === selectedSport)?.name}.
                </p>
                <Button variant="outline" onClick={() => setSelectedSport(undefined)}>
                  View All Sports
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {leaderboardData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Crown className="text-yellow-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {leaderboardData[0]?.name || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSport ? `${SPORTS.find(s => s.id === selectedSport)?.name} Champion` : 'Current Champion'}
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {leaderboardData.length}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedSport ? `${SPORTS.find(s => s.id === selectedSport)?.name} Players` : 'Active Players'}
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(leaderboardData.reduce((sum, user) => sum + user.score, 0) / leaderboardData.length)}
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How Karma Works */}
        <Card className="mt-8">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">How Karma Points Work</h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-green-700">Earn Points For:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    Organizing successful events (+10 points)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    Attending events (+5 points)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    Positive feedback from players (+3 points)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">+</span>
                    Helping new players (+2 points)
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-red-700">Lose Points For:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">-</span>
                    No-shows without notice (-5 points)
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">-</span>
                    Canceling events last minute (-3 points)
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-500 mr-2">-</span>
                    Negative behavior reports (-10 points)
                  </li>
                </ul>
              </div>
            </div>
            
            {selectedSport && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    {SPORTS.find(s => s.id === selectedSport)?.icon}
                    <span className="ml-2">Sport-Specific Rankings</span>
                  </h4>
                  <p className="text-sm text-blue-800">
                    When filtering by {SPORTS.find(s => s.id === selectedSport)?.name}, rankings show karma points 
                    and activities specifically related to this sport. Only players with recorded skill levels 
                    in this sport are included in the rankings.
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
  );
};