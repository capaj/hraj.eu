import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { SPORTS, SKILL_LEVELS } from '../../lib/constants';
import { MapPin, Calendar, Clock, Users, Euro, FileText, AlertTriangle, Info, Shield } from 'lucide-react';

interface CreateEventFormProps {
  onSubmit: (eventData: any) => void;
  onCancel: () => void;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({ onSubmit, onCancel }) => {
  // Calculate default date (one week from now) and format it for input
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Add 7 days
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    address: '',
    date: getDefaultDate(),
    startTime: '18:00',
    duration: 90,
    minParticipants: 2,
    idealParticipants: 8,
    maxParticipants: 10,
    cancellationHours: 2,
    cancellationMinutes: 0,
    price: '',
    paymentDetails: '',
    gameRules: '',
    isPublic: true,
    allowedSkillLevels: ['beginner', 'intermediate', 'advanced'], // All levels allowed by default
    requireSkillLevel: false, // Whether to enforce skill level restrictions
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-adjust ideal and max when min changes
      if (field === 'minParticipants') {
        if (newData.idealParticipants < value) {
          newData.idealParticipants = value;
        }
        if (newData.maxParticipants < value) {
          newData.maxParticipants = value;
        }
      }
      
      // Auto-adjust max when ideal changes
      if (field === 'idealParticipants') {
        if (newData.maxParticipants < value) {
          newData.maxParticipants = value;
        }
      }
      
      return newData;
    });
  };

  const handleSkillLevelToggle = (skillLevel: string) => {
    setFormData(prev => {
      const currentLevels = prev.allowedSkillLevels;
      const isCurrentlyAllowed = currentLevels.includes(skillLevel);
      
      let newAllowedLevels;
      if (isCurrentlyAllowed) {
        // Remove the skill level (but ensure at least one remains)
        newAllowedLevels = currentLevels.filter(level => level !== skillLevel);
        if (newAllowedLevels.length === 0) {
          // Don't allow removing all skill levels
          return prev;
        }
      } else {
        // Add the skill level
        newAllowedLevels = [...currentLevels, skillLevel];
      }
      
      return {
        ...prev,
        allowedSkillLevels: newAllowedLevels
      };
    });
  };

  const getTotalCancellationTime = () => {
    const totalMinutes = formData.cancellationHours * 60 + formData.cancellationMinutes;
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else if (totalMinutes === 60) {
      return '1 hour';
    } else if (totalMinutes % 60 === 0) {
      return `${Math.floor(totalMinutes / 60)} hours`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`;
    }
  };

  const getSkillLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'beginner': return 'success' as const;
      case 'intermediate': return 'warning' as const;
      case 'advanced': return 'error' as const;
      default: return 'default' as const;
    }
  };

  const getSkillLevelDescription = (levels: string[]) => {
    if (levels.length === 3) {
      return 'All skill levels welcome';
    } else if (levels.length === 2) {
      const levelNames = levels.map(level => SKILL_LEVELS.find(l => l.id === level)?.name).join(' and ');
      return `${levelNames} players only`;
    } else {
      const levelName = SKILL_LEVELS.find(l => l.id === levels[0])?.name;
      return `${levelName} players only`;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto animate-slide-up">
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
        <p className="text-gray-600">Fill in the details to organize your next game</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Sunday Football at the Park"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <select
                required
                value={formData.sport}
                onChange={(e) => handleChange('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a sport</option>
                {SPORTS.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Location & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin size={20} className="mr-2" />
              Location & Time
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Park name, street address, or landmark"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  min="30"
                  max="180"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users size={20} className="mr-2" />
              Participants
            </h3>
            
            {/* Cancellation Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle size={20} className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-amber-800 font-medium mb-1">Event Cancellation Policy</p>
                  <p className="text-amber-700">
                    If fewer than the minimum number of players join by the cancellation deadline, 
                    the event will be automatically cancelled and all participants will be notified.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Players *
                </label>
                <input
                  type="number"
                  required
                  value={formData.minParticipants}
                  onChange={(e) => handleChange('minParticipants', parseInt(e.target.value))}
                  min="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Required to confirm event</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ideal Players *
                </label>
                <input
                  type="number"
                  required
                  value={formData.idealParticipants}
                  onChange={(e) => handleChange('idealParticipants', parseInt(e.target.value))}
                  min={formData.minParticipants}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Perfect number for best game</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Players *
                </label>
                <input
                  type="number"
                  required
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))}
                  min={formData.idealParticipants}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum capacity</p>
              </div>
            </div>

            {/* Cancellation Timing */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Cancellation Deadline *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                How long before the event should we check if there are enough players?
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                  <input
                    type="number"
                    value={formData.cancellationHours}
                    onChange={(e) => handleChange('cancellationHours', parseInt(e.target.value) || 0)}
                    min="0"
                    max="72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Minutes</label>
                  <select
                    value={formData.cancellationMinutes}
                    onChange={(e) => handleChange('cancellationMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={0}>0</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={45}>45</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Info size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>Deadline:</strong> {getTotalCancellationTime()} before the event starts
                    {formData.date && formData.startTime && (
                      <div className="mt-1 text-blue-700">
                        We'll check for minimum players and decide whether to proceed or cancel the event.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Level Restrictions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900 flex items-center">
                <Shield size={18} className="mr-2 text-primary-600" />
                Skill Level Requirements
              </h4>
              <Toggle
                checked={formData.requireSkillLevel}
                onChange={(checked) => handleChange('requireSkillLevel', checked)}
              >
                Enforce skill level restrictions
              </Toggle>
            </div>

            {formData.requireSkillLevel ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select which skill levels are allowed to join this event. Only players with these skill levels in {formData.sport ? SPORTS.find(s => s.id === formData.sport)?.name : 'the selected sport'} will be able to join.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SKILL_LEVELS.map((level) => {
                    const isSelected = formData.allowedSkillLevels.includes(level.id);
                    const isOnlySelected = formData.allowedSkillLevels.length === 1 && isSelected;
                    
                    return (
                      <label
                        key={level.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          isOnlySelected ? 'opacity-75' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSkillLevelToggle(level.id)}
                          disabled={isOnlySelected}
                          className="text-primary-600 focus:ring-primary-500 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{level.name}</span>
                            <Badge variant={getSkillLevelBadgeVariant(level.id)} size="sm">
                              {level.name}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {level.id === 'beginner' && 'New to the sport or casual players'}
                            {level.id === 'intermediate' && 'Regular players with some experience'}
                            {level.id === 'advanced' && 'Experienced competitive players'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Current Selection Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Current Restriction</p>
                      <p>{getSkillLevelDescription(formData.allowedSkillLevels)}</p>
                      {formData.allowedSkillLevels.length < 3 && (
                        <p className="mt-2 text-blue-700">
                          Players without the required skill level in {formData.sport ? SPORTS.find(s => s.id === formData.sport)?.name : 'this sport'} will not be able to join this event.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info size={16} className="text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Open to All Skill Levels</p>
                    <p>
                      When skill level restrictions are disabled, players of any skill level can join your event. 
                      This is great for casual games and welcoming new players to the sport.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Euro size={20} className="mr-2" />
              Payment (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Person (€)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value ? parseFloat(e.target.value) : '')}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Details
                </label>
                <input
                  type="text"
                  value={formData.paymentDetails}
                  onChange={(e) => handleChange('paymentDetails', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Revolut: @username or cash on spot"
                />
              </div>
            </div>
          </div>

          {/* Game Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText size={20} className="mr-2" />
              Game Rules (Optional)
            </h3>
            <textarea
              value={formData.gameRules}
              onChange={(e) => handleChange('gameRules', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="No slide tackles, bring light/dark shirt, call your own fouls..."
            />
          </div>

          {/* Visibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Visibility</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic}
                  onChange={() => handleChange('isPublic', true)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Public (discoverable by everyone)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.isPublic}
                  onChange={() => handleChange('isPublic', false)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Private (invite-only)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Event
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};