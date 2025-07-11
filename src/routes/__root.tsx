/// <reference types="vite/client" />
import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Header } from '../components/layout/Header'
import { Providers } from '~/lib/providers'
import '../index.css'
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
  return (
    <html>
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
