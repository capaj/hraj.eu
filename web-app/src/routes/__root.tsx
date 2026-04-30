/// <reference types="vite/client" />
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts
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
      }
    ]
  }),
  component: RootComponent
})

function RootComponent() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('react-grab')
    }
  }, [])

  return (
    <RootDocument>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
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
