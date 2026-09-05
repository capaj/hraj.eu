import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack'
import { I18nProvider } from '@lingui/react'
import { Link, useRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { OnboardingRedirect } from '~/components/auth/OnboardingRedirect'
import { updateUserTimezone } from '~/server-functions/updateUserTimezone'
import {
  authClient,
  authSessionQueryKey,
  useAuthSession
} from './auth-client'
import { activateLocale, i18n, type AppLocale } from './i18n'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60
    }
  }
})

const authUIClient = authClient as unknown as ComponentProps<
  typeof AuthUIProviderTanstack
>['authClient']

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem('locale') : null
    if (stored === 'en' || stored === 'cs') activateLocale(stored as AppLocale)
  }, [])

  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthQueryProvider sessionKey={authSessionQueryKey}>
          <AuthUIProviderTanstack
            social={{
              providers: ['google', 'facebook']
            }}
            magicLink={true}
            authClient={authUIClient}
            navigate={(href) => router.navigate({ href })}
            replace={(href) => router.navigate({ href, replace: true })}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
          >
            <OnboardingRedirect />
            <UserTimezoneSync />
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </AuthUIProviderTanstack>
        </AuthQueryProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}

function UserTimezoneSync() {
  const session = useAuthSession()
  const pendingTimezone = useRef<string | null>(null)
  const storedTimezone = session.data?.user?.timezone

  useEffect(() => {
    if (!session.data?.user?.id || typeof window === 'undefined') {
      return
    }

    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (
      !browserTimezone ||
      storedTimezone === browserTimezone ||
      pendingTimezone.current === browserTimezone
    ) {
      return
    }

    pendingTimezone.current = browserTimezone
    updateUserTimezone({ data: { timezone: browserTimezone } }).catch((error) => {
      pendingTimezone.current = null
      console.error('Failed to update user timezone', error)
    })
  }, [session.data?.user?.id, storedTimezone])

  return null
}
