import { i18n as defaultI18n, type I18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { type PropsWithChildren } from 'react'
import { routeTree } from './routeTree.gen'
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary'
import { NotFound } from './components/ui/NotFound'

type RouterOpts = { i18n?: I18n }

export function createRouter({ i18n = defaultI18n }: RouterOpts = {}) {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    Wrap: ({ children }: PropsWithChildren) => {
      return <I18nProvider i18n={i18n}>{children}</I18nProvider>
    }
  })
  return router
}

let routerSingleton: ReturnType<typeof createRouter> | null = null

export function getRouter({ i18n = defaultI18n }: RouterOpts = {}) {
  if (!routerSingleton) {
    routerSingleton = createRouter({ i18n })
  }

  return routerSingleton
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
