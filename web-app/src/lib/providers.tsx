import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack'
import { I18nProvider } from '@lingui/react'
import { Link, useRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { authClient } from './auth-client'
import { activateLocale, i18n, type AppLocale } from './i18n'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60
    }
  }
})
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
        <AuthQueryProvider>
          <AuthUIProviderTanstack
            social={{
              providers: ['google', 'facebook']
            }}
            magicLink={true}
            authClient={authClient}
            navigate={(href) => router.navigate({ href })}
            replace={(href) => router.navigate({ href, replace: true })}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
          >
            {children}
          </AuthUIProviderTanstack>
        </AuthQueryProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}
