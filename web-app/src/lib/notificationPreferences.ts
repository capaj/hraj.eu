export const EMAIL_NOTIFICATIONS_DISABLED_KEY = 'email_notifications_disabled'

export function areEmailNotificationsEnabled(
  notificationPreferences?: Record<string, boolean> | null,
  emailNotificationsDisabled?: boolean | null
): boolean {
  if (emailNotificationsDisabled === true) {
    return false
  }

  return notificationPreferences?.[EMAIL_NOTIFICATIONS_DISABLED_KEY] !== true
}
