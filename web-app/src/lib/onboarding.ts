const ONBOARDING_SESSION_KEY_PREFIX = 'hraj:onboarding-checked'

export function getOnboardingSessionKey(userId: string, sessionId: string) {
  return `${ONBOARDING_SESSION_KEY_PREFIX}:${userId}:${sessionId}`
}

export function isOnboardingRedirectExcluded(pathname: string) {
  return (
    pathname === '/onboarding' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/scenarios/')
  )
}

export function getSafeOnboardingReturnPath(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/onboarding')
  ) {
    return '/'
  }

  return value
}
