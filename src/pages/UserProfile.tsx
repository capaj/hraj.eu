import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockUsers } from '../lib/mock-data';
import { SPORTS, SKILL_LEVELS, EU_CURRENCIES } from '../lib/constants';
import { User } from '../types';
import { 
  User as UserIcon, 
  Camera, 
  Save, 
  MapPin, 
  Mail, 
  Calendar,
  Trophy,
  Settings,
  Globe,
  Star,
  Edit3,
  Upload,
  X,
  Plus,
  Check,
  CreditCard,
  Building2,
  ChevronDown
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User>(mockUsers[0]); // Current user
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRevTag, setIsEditingRevTag] = useState(false);
  const [isEditingBankAccount, setIsEditingBankAccount] = useState(false);
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const [editedRevTag, setEditedRevTag] = useState(user.revTag || '');
  const [editedBankAccount, setEditedBankAccount] = useState(user.bankAccount || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [skillLevelChanges, setSkillLevelChanges] = useState<Record<string, string | null>>({});

  const handleSave = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser(editedUser);
    setIsEditing(false);
    setSkillLevelChanges({});
    
    // In a real app, this would make an API call to update the user
    console.log('User updated:', editedUser);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
    setSkillLevelChanges({});
  };

  const handleSaveRevTag = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, revTag: editedRevTag };
      setUser(updatedUser);
      setEditedUser(updatedUser);
      setIsEditingRevTag(false);
      
      console.log('Revolut tag updated:', editedRevTag);
    } catch (error) {
      console.error('Failed to update Revolut tag:', error);
      alert('Failed to update Revolut tag. Please try again.');
    }
  };

  const handleCancelRevTag = () => {
    setEditedRevTag(user.revTag || '');
    setIsEditingRevTag(false);
  };

  const handleSaveBankAccount = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, bankAccount: editedBankAccount };
      setUser(updatedUser);
      setEditedUser(updatedUser);
      setIsEditingBankAccount(false);
      
      console.log('Bank account updated:', editedBankAccount);
    } catch (error) {
      console.error('Failed to update bank account:', error);
      alert('Failed to update bank account. Please try again.');
    }
  };

  const handleCancelBankAccount = () => {
    setEditedBankAccount(user.bankAccount || '');
    setIsEditingBankAccount(false);
  };

  const handleSkillLevelChange = async (sport: string, level: string | null) => {
    // Update the edited user state
    setEditedUser(prev => {
      const newSkillLevels = { ...prev.skillLevels };
      if (level === null) {
        delete newSkillLevels[sport];
      } else {
        newSkillLevels[sport] = level as 'beginner' | 'intermediate' | 'advanced';
      }
      return { ...prev, skillLevels: newSkillLevels };
    });

    // Track the change for visual feedback
    setSkillLevelChanges(prev => ({ ...prev, [sport]: level }));

    // Auto-save skill level changes (even when not in full edit mode)
    if (!isEditing) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the main user state
        setUser(prev => {
          const newSkillLevels = { ...prev.skillLevels };
          if (level === null) {
            delete newSkillLevels[sport];
          } else {
            newSkillLevels[sport] = level as 'beginner' | 'intermediate' | 'advanced';
          }
          return { ...prev, skillLevels: newSkillLevels };
        });

        // Clear the change indicator after a delay
        setTimeout(() => {
          setSkillLevelChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[sport];
            return newChanges;
          });
        }, 1500);

        console.log(`Skill level updated for ${sport}: ${level}`);
      } catch (error) {
        console.error('Failed to update skill level:', error);
        // Revert the change on error
        setEditedUser(prev => ({ ...prev, skillLevels: user.skillLevels }));
        setSkillLevelChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[sport];
          return newChanges;
        });
      }
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    // Update the edited user state
    setEditedUser(prev => ({ ...prev, preferredCurrency: newCurrency }));

    // Auto-save currency changes (even when not in full edit mode)
    if (!isEditing) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update the main user state
        setUser(prev => ({ ...prev, preferredCurrency: newCurrency }));
        
        console.log(`Currency updated to: ${newCurrency}`);
      } catch (error) {
        console.error('Failed to update currency:', error);
        // Revert the change on error
        setEditedUser(prev => ({ ...prev, preferredCurrency: user.preferredCurrency }));
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you'd upload to a service like Cloudinary or AWS S3
      // For demo, we'll use a placeholder URL
      const newAvatarUrl = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`;
      
      setEditedUser(prev => ({ ...prev, avatar: newAvatarUrl }));
      setShowAvatarUpload(false);
      
      console.log('Avatar uploaded:', file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
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

  const selectedCurrency = EU_CURRENCIES.find(c => c.code === editedUser.preferredCurrency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <UserIcon className="mr-3 text-white" size={32} />
            My Profile
          </h1>
          <p className="text-white/80 mt-2">Manage your account settings and sports preferences</p>
        </div>

        {/* Profile Overview Card - Full Width */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <img
                  src={editedUser.avatar}
                  alt={editedUser.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {isEditing && (
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute bottom-2 right-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition-colors shadow-lg"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{editedUser.name}</h2>
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-2 lg:space-y-0 text-gray-600 mb-4">
                  <div className="flex items-center justify-center lg:justify-start">
                    <Mail size={16} className="mr-2" />
                    {editedUser.email}
                  </div>
                  {editedUser.location && (
                    <div className="flex items-center justify-center lg:justify-start">
                      <MapPin size={16} className="mr-2" />
                      {editedUser.location}
                    </div>
                  )}
                  <div className="flex items-center justify-center lg:justify-start">
                    <Calendar size={16} className="mr-2" />
                    Member since {editedUser.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {/* Karma Points */}
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg px-6 py-3">
                  <Trophy className="text-yellow-500 mr-3" size={24} />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{editedUser.karmaPoints}</div>
                    <div className="text-sm text-gray-600">Karma Points</div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex-shrink-0">
                {!isEditing ? (
                  <Button variant="primary" onClick={() => setIsEditing(true)} size="lg">
                    <Edit3 size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout for Settings */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Settings size={20} className="mr-2" />
                  Personal Information
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.name}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{user.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="py-2 text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">Contact support to change email</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.location || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="City, Country"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{user.location || 'Not specified'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedUser.bio || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tell us about yourself and your sports interests..."
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{user.bio || 'No bio provided'}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Payment Information with Currency Preference */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CreditCard size={20} className="mr-2" />
                  Payment Information
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Add your payment details and currency preference for easy event transactions
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {/* Currency Preference Section */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 flex items-center mb-4">
                      <Globe size={18} className="mr-2 text-primary-600" />
                      Currency Preference
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose your preferred currency for event pricing
                    </p>
                    
                    <div className="relative">
                      <select
                        value={editedUser.preferredCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white pr-10"
                      >
                        {EU_CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name} ({currency.code}) - {currency.countries.slice(0, 2).join(', ')}{currency.countries.length > 2 && ` +${currency.countries.length - 2} more`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {selectedCurrency && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-sm text-blue-800">
                          <Check size={16} className="mr-2 text-blue-600" />
                          <span>
                            Selected: <strong>{selectedCurrency.symbol} {selectedCurrency.name}</strong> - 
                            Used in {selectedCurrency.countries.length} countries
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Revolut Tag Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Revolut Tag
                      </label>
                      {!isEditingRevTag ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingRevTag(true)}>
                          <Edit3 size={14} className="mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={handleCancelRevTag}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" onClick={handleSaveRevTag}>
                            <Save size={14} className="mr-1" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {isEditingRevTag ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                        <input
                          type="text"
                          value={editedRevTag}
                          onChange={(e) => setEditedRevTag(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="username"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="py-2 text-gray-900">
                        {user.revTag ? `@${user.revTag}` : 'Not specified'}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Your Revolut username for quick payments
                    </div>
                  </div>

                  {/* Bank Account Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Czech Bank Account
                      </label>
                      {!isEditingBankAccount ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingBankAccount(true)}>
                          <Edit3 size={14} className="mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={handleCancelBankAccount}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" onClick={handleSaveBankAccount}>
                            <Save size={14} className="mr-1" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {isEditingBankAccount ? (
                      <input
                        type="text"
                        value={editedBankAccount}
                        onChange={(e) => setEditedBankAccount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                        placeholder="123456789/0100"
                        autoFocus
                      />
                    ) : (
                      <div className="py-2 text-gray-900 font-mono">
                        {user.bankAccount || 'Not specified'}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Czech bank account number (format: account/bank code)
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Building2 size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Payment Security</p>
                        <p>
                          Your payment information is encrypted and only shared with event organizers when you join paid events. 
                          You can always choose to pay in cash at the venue instead.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sports & Skill Levels - Full Width with Two-Column Grid */}
        <Card className="mt-8">
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Star size={20} className="mr-2" />
              Sports & Skill Levels
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Click on any sport to set or change your skill level
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {SPORTS.map((sport) => {
                const currentLevel = editedUser.skillLevels[sport.id];
                const hasRecentChange = skillLevelChanges[sport.id] !== undefined;
                
                return (
                  <div 
                    key={sport.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                      hasRecentChange 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-2xl flex-shrink-0">{sport.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{sport.name}</div>
                        {hasRecentChange && (
                          <div className="flex items-center text-sm text-green-600 mt-1">
                            <Check size={14} className="mr-1" />
                            Updated!
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Skill Level Buttons */}
                      <div className="flex items-center space-x-1">
                        {SKILL_LEVELS.map((level) => {
                          const isSelected = currentLevel === level.id;
                          const isChanging = hasRecentChange && skillLevelChanges[sport.id] === level.id;
                          
                          return (
                            <button
                              key={level.id}
                              onClick={() => handleSkillLevelChange(sport.id, isSelected ? null : level.id)}
                              disabled={hasRecentChange}
                              className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                                isSelected
                                  ? level.id === 'beginner'
                                    ? 'bg-green-500 text-white'
                                    : level.id === 'intermediate'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              } ${
                                hasRecentChange ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                isChanging ? 'ring-2 ring-green-400' : ''
                              }`}
                            >
                              {isChanging ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                  {level.name.charAt(0)}
                                </div>
                              ) : (
                                level.name.charAt(0).toUpperCase()
                              )}
                            </button>
                          );
                        })}
                        
                        {/* Clear button */}
                        {currentLevel && !hasRecentChange && (
                          <button
                            onClick={() => handleSkillLevelChange(sport.id, null)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                            title="Remove skill level"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.keys(user.skillLevels).length === 0 && Object.keys(skillLevelChanges).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Star size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No skill levels set</p>
                <p className="text-sm">Click on any sport above to set your skill level!</p>
              </div>
            )}

            {/* Quick tip */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Star size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Quick Tip</p>
                  <p>
                    Setting accurate skill levels helps you find games with players of similar abilities. 
                    You can change these anytime by clicking the skill level buttons. <strong>B</strong> = Beginner, <strong>I</strong> = Intermediate, <strong>A</strong> = Advanced.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Profile Picture</h3>
                <button
                  onClick={() => setShowAvatarUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isUploadingAvatar}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium">Choose a profile picture</p>
                    <p>JPG, PNG or GIF up to 5MB</p>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer ${
                      isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Select Image
                      </>
                    )}
                  </label>
                </div>

                <div className="text-xs text-gray-500">
                  <p>• Image will be cropped to a square</p>
                  <p>• Recommended size: 400x400 pixels</p>
                  <p>• Supported formats: JPG, PNG, GIF</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};