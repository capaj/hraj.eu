/// <reference types="vite/client" />
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts,
  useRouterState
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { Header } from '../components/layout/Header'
import { Providers } from '~/lib/providers'
import appCss from '../styles/app.css?url'
import { buildSeoMeta } from '~/lib/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        name: 'theme-color',
        content: '#16a34a'
      },
      {
        name: 'robots',
        content: 'index, follow'
      },
      ...buildSeoMeta()
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg?v=soccer-play'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png?v=soccer-play'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png?v=soccer-play'
      },
      {
        rel: 'shortcut icon',
        href: '/favicon.ico?v=soccer-play'
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png?v=soccer-play'
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest?v=soccer-play'
      }
    ]
  }),
  component: RootComponent
})

function RootComponent() {
  const isScenario = useRouterState({
    select: (state) => state.location.pathname.startsWith('/scenarios/')
  })

  useEffect(() => {
    if (import.meta.env.DEV && !isScenario) {
      void import('react-grab')
    }
  }, [isScenario])

  return (
    <RootDocument>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Outlet />
      </div>
      {import.meta.env.DEV && !isScenario ? <TanStackRouterDevtools /> : null}
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Scripts />
      </body>
    </html>
  )
}
