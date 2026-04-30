import React, { useState, useRef, useEffect } from 'react'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Bell,
  User,
  Plus,
  Check,
  X,
  Calendar,
  Trophy,
  Users,
  Euro,
  AlertTriangle,
  CheckCircle,
  Menu
} from 'lucide-react'
import { Notification } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import { UserButton } from '../user/UserButton'
import { authClient } from '~/lib/auth-client'
import { activateLocale, type AppLocale } from '~/lib/i18n'
import { LanguageSelector } from './LanguageSelector'

export const Header: React.FC = () => {
  const session = authClient.useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { i18n } = useLingui()

  const currentLocale = (i18n.locale as AppLocale) ?? 'cs'
  const setLocale = (locale: AppLocale) => {
    activateLocale(locale)
    if (typeof window !== 'undefined') window.localStorage.setItem('locale', locale)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-[2000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Menu size={20} />
          </button>
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 cursor-pointer">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                hraj.eu
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="transition-colors text-gray-700 hover:text-primary-600"
              activeProps={{ className: 'text-primary-600 font-medium' }}
            >
              <Trans>Discover</Trans>
            </Link>

            <Link
              to="/profile"
              className="transition-colors text-gray-700 hover:text-primary-600"
              activeProps={{ className: 'text-primary-600 font-medium' }}
            >
              <Trans>My Events</Trans>
            </Link>
            <Link
              to="/leaderboard"
              className="transition-colors text-gray-700 hover:text-primary-600"
              activeProps={{ className: 'text-primary-600 font-medium' }}
            >
              <Trans>Leaderboard</Trans>
            </Link>
            <Link
              to="/about"
              className="transition-colors text-gray-700 hover:text-primary-600"
              activeProps={{ className: 'text-primary-600 font-medium' }}
            >
              <Trans>About</Trans>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center">
              <label className="sr-only" htmlFor="locale-select">
                <Trans>Language</Trans>
              </label>
              <LanguageSelector
                currentLocale={currentLocale}
                onLocaleChange={setLocale}
                triggerId="locale-select"
              />
            </div>

            <Link to="/create" className="hidden sm:inline-flex">
              <Button variant="primary" size="sm">
                <Plus size={16} className="mr-2" />
                <Trans>Create Event</Trans>
              </Button>
            </Link>

            {/* Notifications Dropdown */}
            {session.data?.user && <NotificationsDropdown />}

            <Link
              to="/user-profile"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              <UserButton size="icon" />
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-4">
              <div className="py-2">
                <label className="block text-xs text-gray-500 mb-2">
                  <Trans>Language</Trans>
                </label>
                <LanguageSelector
                  currentLocale={currentLocale}
                  onLocaleChange={setLocale}
                  triggerId="mobile-locale-select"
                  fullWidth
                />
              </div>

              <Link
                to="/"
                className="block transition-colors text-gray-700 hover:text-primary-600 py-2"
                activeProps={{ className: 'text-primary-600 font-medium' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trans>Discover</Trans>
              </Link>

              <Link
                to="/profile"
                className="block transition-colors text-gray-700 hover:text-primary-600 py-2"
                activeProps={{ className: 'text-primary-600 font-medium' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trans>My Events</Trans>
              </Link>
              <Link
                to="/leaderboard"
                className="block transition-colors text-gray-700 hover:text-primary-600 py-2"
                activeProps={{ className: 'text-primary-600 font-medium' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trans>Leaderboard</Trans>
              </Link>
              <Link
                to="/about"
                className="block transition-colors text-gray-700 hover:text-primary-600 py-2"
                activeProps={{ className: 'text-primary-600 font-medium' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trans>About</Trans>
              </Link>
              <Link
                to="/create"
                className="block transition-colors text-gray-700 hover:text-primary-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="primary" size="sm">
                  <Plus size={16} className="mr-2" />
                  <Trans>Create Event</Trans>
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export const NotificationsDropdown = () => {
  const { i18n } = useLingui()
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const session = authClient.useSession()
  const currentUserId = session.data?.user?.id
  // TODO: Fetch notifications from server when notifications table is implemented
  const [notifications, setNotifications] = useState<Notification[]>([])
  const userNotifications = notifications.filter(
    (n) => n.userId === currentUserId
  )
  const unreadCount = userNotifications.filter((n) => !n.isRead).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUserId ? { ...n, isRead: true } : n))
    )
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_joined':
        return <Users size={16} className="text-blue-500" />
      case 'event_confirmed':
        return <CheckCircle size={16} className="text-green-500" />
      case 'event_cancelled':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'event_reminder':
        return <Calendar size={16} className="text-orange-500" />
      case 'karma_received':
        return <Trophy size={16} className="text-yellow-500" />
      case 'payment_received':
        return <Euro size={16} className="text-green-500" />
      case 'moved_from_waitlist':
        return <CheckCircle size={16} className="text-blue-500" />
      default:
        return <Bell size={16} className="text-gray-500" />
    }
  }

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 text-gray-600 hover:text-primary-600 transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                <Trans>Notifications</Trans>
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Trans>Mark all read</Trans>
                  </button>
                )}
                <Badge variant="info" size="sm">
                  {userNotifications.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {userNotifications.length > 0 ? (
              userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.isRead
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : ''
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm ${!notification.isRead
                              ? 'font-semibold text-gray-900'
                              : 'text-gray-700'
                              }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(notification.createdAt, {
                                addSuffix: true
                              })}
                            </span>
                            {notification.eventId && (
                              <span className="text-xs text-blue-600">
                                • <Trans>Event</Trans> #{notification.eventId.slice(0, 8)}
                              </span>
                            )}
                            {notification.fromUserId && (
                              <span className="text-xs text-green-600">
                                • <Trans>from User</Trans> #{notification.fromUserId.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title={i18n._(msg`Mark as read`)}
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title={i18n._(msg`Delete notification`)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <Trans>No notifications yet</Trans>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  <Trans>You'll see updates about your events here</Trans>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {userNotifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowNotifications(false)
                  // In a real app, navigate to notifications page
                  console.log('Navigate to all notifications')
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium w-full text-center"
              >
                <Trans>View all notifications</Trans>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
