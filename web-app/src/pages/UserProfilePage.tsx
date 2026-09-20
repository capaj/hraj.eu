import React, { useState } from 'react'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { User, type SkillLevel } from '../types'
import { UserAvatar } from '../components/user/UserAvatar'
import { normalizeAccountNumberForQrPayment } from '../lib/qrCodeGenerator'
import { ProfilePhoneField } from '../components/user/ProfilePhoneField'
import { PaymentInformationCard } from '../components/user/PaymentInformationCard'
import {
  NotificationSettingsCard,
  SkillLevelSettingsCard
} from '../components/user/SportsPreferencesCards'
import {
  User as UserIcon,
  Camera,
  Save,
  MapPin,
  Mail,
  Calendar,
  Trophy,
  Settings,
  Edit3,
  Upload,
  X,
  Lock,
  Trash2,
  AlertTriangle,
  Shield,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'

import { useLoaderData } from '@tanstack/react-router'
import { updateUserSkill } from '~/server-functions/updateUserSkill'
import { updateUserProfile } from '~/server-functions/updateUserProfile'
import { deleteUserAccount } from '~/server-functions/deleteUserAccount'
import { authClient } from '~/lib/auth-client'
import { toast } from 'sonner'
import { i18n } from '~/lib/i18n'

export const UserProfile: React.FC = () => {
  const { user: userFromLoader } = useLoaderData({ from: '/user-profile' })

  const [user, setUser] = useState<User>({
    ...userFromLoader,
    image: userFromLoader.image ?? undefined,
    karmaPoints: userFromLoader.karmaPoints ?? 0,
    skillLevels: userFromLoader.skillLevels ?? {},
    notificationPreferences: userFromLoader.notificationPreferences ?? {},
    emailNotificationsDisabled:
      userFromLoader.emailNotificationsDisabled ?? false,
    preferredCurrency: userFromLoader.preferredCurrency ?? 'EUR',
    phone: userFromLoader.phone ?? '',
    location: userFromLoader.location ?? '',
    revTag: userFromLoader.revTag ?? '',
    bankAccount: userFromLoader.bankAccount ?? '',
    createdAt: new Date(userFromLoader.createdAt)
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<User>(() => ({ ...user }))
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [skillLevelChanges, setSkillLevelChanges] = useState<
    Record<string, SkillLevel | null>
  >({})
  const [notificationChanges, setNotificationChanges] = useState<
    Record<string, boolean>
  >({})
  const [isSavingEmailPreference, setIsSavingEmailPreference] = useState(false)

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const handleSave = async () => {
    try {
      await updateUserProfile({
        data: {
          name: editedUser.name,
          phone: editedUser.phone,
          location: editedUser.location,
          bio: editedUser.bio,
          image: editedUser.image
        }
      })

      setUser(editedUser)
      setIsEditing(false)
      setSkillLevelChanges({})
      setNotificationChanges({})

      toast.success(i18n._(msg`Profile updated successfully!`))
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error(i18n._(msg`Failed to update profile`))
    }
  }

  const handleCancel = () => {
    setEditedUser({ ...user })
    setIsEditing(false)
    setSkillLevelChanges({})
    setNotificationChanges({})
  }

  const handleSaveRevTag = async (revolutTag: string) => {
    try {
      await updateUserProfile({
        data: {
          revolutTag
        }
      })

      const updatedUser = { ...user, revTag: revolutTag }
      setUser(updatedUser)
      setEditedUser(updatedUser)

      toast.success(i18n._(msg`Revolut tag updated!`))
      return true
    } catch (error) {
      console.error('Failed to update Revolut tag:', error)
      toast.error(i18n._(msg`Failed to update Revolut tag`))
      return false
    }
  }

  const handleSaveBankAccount = async (bankAccount: string) => {
    if (bankAccount.trim() && !normalizeAccountNumberForQrPayment(bankAccount)) {
      toast.error(i18n._(msg`Enter a valid Czech bank account or IBAN.`))
      return false
    }
    try {
      await updateUserProfile({
        data: {
          bankAccount
        }
      })

      const updatedUser = { ...user, bankAccount }
      setUser(updatedUser)
      setEditedUser(updatedUser)

      toast.success(i18n._(msg`Bank account updated!`))
      return true
    } catch (error) {
      console.error('Failed to update bank account:', error)
      toast.error(i18n._(msg`Failed to update bank account`))
      return false
    }
  }

  const handleSkillLevelChange = async (
    sport: string,
    level: SkillLevel | null
  ) => {
    // Update the edited user state
    setEditedUser((prev) => {
      const newSkillLevels = { ...prev.skillLevels }
      if (level === null) {
        delete newSkillLevels[sport]
      } else {
        newSkillLevels[sport] = level
      }
      return { ...prev, skillLevels: newSkillLevels }
    })

    // Track the change for visual feedback
    setSkillLevelChanges((prev) => ({ ...prev, [sport]: level }))

    // Auto-save skill level changes (even when not in full edit mode)
    if (!isEditing) {
      try {
        // Call server function
        await updateUserSkill({
          data: {
            sport,
            skillLevel: level
          }
        })

        // Update the main user state
        setUser((prev) => {
          const newSkillLevels = { ...prev.skillLevels }
          if (level === null) {
            delete newSkillLevels[sport]
          } else {
            newSkillLevels[sport] = level
          }
          return { ...prev, skillLevels: newSkillLevels }
        })

        // Clear the change indicator after a delay
        setTimeout(() => {
          setSkillLevelChanges((prev) => {
            const newChanges = { ...prev }
            delete newChanges[sport]
            return newChanges
          })
        }, 1500)

        console.log(`Skill level updated for ${sport}: ${level}`)
      } catch (error) {
        console.error('Failed to update skill level:', error)
        // Revert the change on error
        setEditedUser((prev) => ({ ...prev, skillLevels: user.skillLevels }))
        setSkillLevelChanges((prev) => {
          const newChanges = { ...prev }
          delete newChanges[sport]
          return newChanges
        })
      }
    }
  }

  const handleNotificationChange = async (sport: string, enabled: boolean) => {
    // Update the edited user state
    setEditedUser((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [sport]: enabled
      }
    }))

    // Track the change for visual feedback
    setNotificationChanges((prev) => ({ ...prev, [sport]: enabled }))

    // Auto-save notification changes (even when not in full edit mode)
    if (!isEditing) {
      try {
        const newPreferences = {
          ...user.notificationPreferences,
          [sport]: enabled
        }

        await updateUserProfile({
          data: {
            notificationPreferences: newPreferences
          }
        })

        // Update the main user state
        setUser((prev) => ({
          ...prev,
          notificationPreferences: newPreferences
        }))

        // Clear the change indicator after a delay
        setTimeout(() => {
          setNotificationChanges((prev) => {
            const newChanges = { ...prev }
            delete newChanges[sport]
            return newChanges
          })
        }, 1500)

      } catch (error) {
        console.error('Failed to update notification preference:', error)
        toast.error(i18n._(msg`Failed to update notification`))
        // Revert the change on error
        setEditedUser((prev) => ({
          ...prev,
          notificationPreferences: user.notificationPreferences
        }))
        setNotificationChanges((prev) => {
          const newChanges = { ...prev }
          delete newChanges[sport]
          return newChanges
        })
      }
    }
  }

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    const disabled = !enabled
    setIsSavingEmailPreference(true)

    try {
      await updateUserProfile({
        data: { emailNotificationsDisabled: disabled }
      })
      setUser((previous) => ({
        ...previous,
        emailNotificationsDisabled: disabled
      }))
      setEditedUser((previous) => ({
        ...previous,
        emailNotificationsDisabled: disabled
      }))
      toast.success(
        enabled
          ? i18n._(msg`Event emails enabled`)
          : i18n._(msg`Event emails disabled`)
      )
    } catch (error) {
      console.error('Failed to update event email preference:', error)
      toast.error(i18n._(msg`Failed to update email preference`))
    } finally {
      setIsSavingEmailPreference(false)
    }
  }

  const handleCurrencyChange = async (newCurrency: string) => {
    // Update the edited user state
    setEditedUser((prev) => ({ ...prev, preferredCurrency: newCurrency }))

    // Auto-save currency changes (even when not in full edit mode)
    if (!isEditing) {
      try {
        await updateUserProfile({
          data: {
            preferredCurrency: newCurrency
          }
        })

        // Update the main user state
        setUser((prev) => ({ ...prev, preferredCurrency: newCurrency }))

        toast.success(i18n._(msg`Currency updated`))
      } catch (error) {
        console.error('Failed to update currency:', error)
        toast.error(i18n._(msg`Failed to update currency`))
        // Revert the change on error
        setEditedUser((prev) => ({
          ...prev,
          preferredCurrency: user.preferredCurrency
        }))
      }
    }
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(i18n._(msg`Please select an image file`))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(i18n._(msg`Image must be smaller than 5MB`))
      return
    }

    setIsUploadingAvatar(true)

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, you'd upload to a service like Cloudinary or AWS S3
      // For demo, we'll use a placeholder URL
      const newAvatarUrl = `https://images.pexels.com/photos/${Math.floor(
        Math.random() * 1000000
      )}/pexels-photo-${Math.floor(
        Math.random() * 1000000
      )}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`

      setEditedUser((prev) => ({ ...prev, image: newAvatarUrl }))
      setShowAvatarUpload(false)

      console.log('Avatar uploaded:', file.name)
    } catch (error) {
      console.error('Upload failed:', error)
      alert(i18n._(msg`Failed to upload image. Please try again.`))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handlePasswordChange = async () => {
    // Validate passwords
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error(i18n._(msg`Please fill in all password fields.`))
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(i18n._(msg`New passwords do not match.`))
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(i18n._(msg`New password must be at least 8 characters long.`))
      return
    }

    setIsChangingPassword(true)

    try {
      await authClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        revokeOtherSessions: true
      })

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordChange(false)

      toast.success(i18n._(msg`Password changed successfully!`))
    } catch (error) {
      console.error('Failed to change password:', error)
      const message = error instanceof Error ? error.message : 'Failed to change password'
      toast.error(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error(i18n._(msg`Please type "DELETE" to confirm account deletion.`))
      return
    }

    setIsDeletingAccount(true)

    try {
      await deleteUserAccount()

      toast.success(i18n._(msg`Account deleted successfully`))

      // Redirect to home or sign-out
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to delete account:', error)
      toast.error(i18n._(msg`Failed to process account deletion`))
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <UserIcon className="mr-3 text-white" size={32} />
            My Profile
          </h1>
          <p className="text-white/80 mt-2">
            Manage your account settings and sports preferences
          </p>
        </div>

        {/* Profile Overview Card - Full Width */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <UserAvatar
                  user={editedUser}
                  className="w-32 h-32 border-4 border-white shadow-lg"
                  fallbackClassName="text-4xl"
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {editedUser.name}
                </h2>
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
                    <Trans>Member since</Trans>{' '}
                    {editedUser.createdAt.toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Karma Points */}
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg px-6 py-3">
                  <Trophy className="text-yellow-500 mr-3" size={24} />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {editedUser.karmaPoints}
                    </div>
                    <div className="text-sm text-gray-600">
                      <Trans>Karma Points</Trans>
                    </div>
                  </div>
                </div>
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
                {/* Edit Button */}
                <div className="flex-shrink-0 flex justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Settings size={20} className="mr-2" />
                    <Trans>Personal Information</Trans>
                  </h3>
                  {!isEditing ? (
                    <Button
                      variant="primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={16} className="mr-2" />
                      <Trans>Edit Profile</Trans>
                    </Button>
                  ) : (
                    <div className="flex space-x-3">
                      <Button variant="outline" onClick={handleCancel}>
                        <Trans>Cancel</Trans>
                      </Button>
                      <Button variant="primary" onClick={handleSave}>
                        <Save size={16} className="mr-2" />
                        <Trans>Save Changes</Trans>
                      </Button>
                    </div>
                  )}
                </div>
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
                        onChange={(e) =>
                          setEditedUser((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{user.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Trans>Email Address</Trans>
                    </label>
                    <div className="py-2 text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      <Trans>Contact support to change email</Trans>
                    </div>
                  </div>

                  <ProfilePhoneField
                    isEditing={isEditing}
                    phone={user.phone}
                    editedPhone={editedUser.phone}
                    onChange={(phone) =>
                      setEditedUser((previous) => ({ ...previous, phone }))
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Trans>Location</Trans>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.location || ''}
                        onChange={(e) =>
                          setEditedUser((prev) => ({
                            ...prev,
                            location: e.target.value
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={i18n._(msg`City, Country`)}
                      />
                    ) : (
                      <div className="py-2 text-gray-900">
                        {user.location || i18n._(msg`Not specified`)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Trans>Bio</Trans>
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedUser.bio || ''}
                        onChange={(e) =>
                          setEditedUser((prev) => ({
                            ...prev,
                            bio: e.target.value
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={i18n._(
                          msg`Tell us about yourself and your sports interests...`
                        )}
                      />
                    ) : (
                      <div className="py-2 text-gray-900">
                        {user.bio || i18n._(msg`No bio provided`)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield size={20} className="mr-2" />
                  <Trans>Account Security</Trans>
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  <Trans>Manage your password and account security settings</Trans>
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Change Password Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Password
                        </h4>
                        <p className="text-xs text-gray-500">
                          Last changed 3 months ago
                        </p>
                      </div>
                      {!showPasswordChange ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPasswordChange(true)}
                        >
                          <Key size={14} className="mr-1" />
                          Change
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPasswordChange(false)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {showPasswordChange && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value
                                }))
                              }
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  current: !prev.current
                                }))
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.current ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  newPassword: e.target.value
                                }))
                              }
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  new: !prev.new
                                }))
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.new ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value
                                }))
                              }
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  confirm: !prev.confirm
                                }))
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.confirm ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword}
                          className="w-full"
                        >
                          {isChangingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Changing Password...
                            </>
                          ) : (
                            <>
                              <Lock size={16} className="mr-2" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Delete Account Section */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          Delete Account
                        </h4>
                        <p className="text-xs text-red-600">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      {!showDeleteConfirm ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="border-gray-300 text-gray-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {showDeleteConfirm && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-red-200">
                        <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertTriangle
                              size={16}
                              className="text-red-600 mr-2 mt-0.5 flex-shrink-0"
                            />
                            <div className="text-sm text-red-800">
                              <p className="font-medium mb-1">
                                Warning: This action cannot be undone
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-red-700">
                                <li>
                                  Your profile and all personal data will be
                                  permanently deleted
                                </li>
                                <li>
                                  You will be removed from all events and
                                  waitlists
                                </li>
                                <li>
                                  Your karma points and achievements will be
                                  lost
                                </li>
                                <li>
                                  Any organized events will be transferred or
                                  cancelled
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-red-800 mb-2">
                            Type "DELETE" to confirm account deletion
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) =>
                              setDeleteConfirmText(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="DELETE"
                          />
                        </div>

                        <Button
                          variant="outline"
                          onClick={handleDeleteAccount}
                          disabled={
                            isDeletingAccount || deleteConfirmText !== 'DELETE'
                          }
                          className="w-full border-red-500 text-red-700 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeletingAccount ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Processing Deletion...
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} className="mr-2" />
                              Permanently Delete Account
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <PaymentInformationCard
              preferredCurrency={editedUser.preferredCurrency}
              revolutTag={user.revTag}
              bankAccount={user.bankAccount}
              onCurrencyChange={handleCurrencyChange}
              onSaveRevolutTag={handleSaveRevTag}
              onSaveBankAccount={handleSaveBankAccount}
            />
          </div>
        </div>

        <SkillLevelSettingsCard
          className="mt-8"
          skillLevels={editedUser.skillLevels}
          pendingChanges={skillLevelChanges}
          onChange={handleSkillLevelChange}
        />

        <NotificationSettingsCard
          className="mt-8"
          notificationPreferences={editedUser.notificationPreferences}
          emailNotificationsEnabled={!user.emailNotificationsDisabled}
          pendingChanges={notificationChanges}
          isSavingEmailPreference={isSavingEmailPreference}
          onSportChange={handleNotificationChange}
          onEmailChange={handleEmailNotificationsChange}
        />
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Profile Picture
                </h3>
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
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
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
  )
}
