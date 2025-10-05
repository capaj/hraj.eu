import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { NotFound } from './components/ui/NotFound'

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound
  })
}

let routerSingleton: ReturnType<typeof createRouter> | null = null

export function getRouter() {
  if (!routerSingleton) {
    routerSingleton = createRouter()
  }

  return routerSingleton
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
