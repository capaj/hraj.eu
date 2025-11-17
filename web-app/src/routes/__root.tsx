/// <reference types="vite/client" />
import { i18n } from '@lingui/core'
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Header } from '../components/layout/Header'
import { Providers } from '~/lib/providers'
import { defaultLocale } from '~/modules/lingui/i18n'
import appCss from '../styles/app.css?url'

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
        title: 'hraj.eu - Amateur Sports Events'
      }
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
  const lang = i18n.locale || defaultLocale

  return (
    <html lang={lang}>
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
