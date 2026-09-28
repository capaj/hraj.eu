import { createFileRoute, notFound } from '@tanstack/react-router'
import { AboutStats } from '~/components/about/AboutStats'

export const Route = createFileRoute('/scenarios/about-stats')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: AboutStatsScenario
})

function AboutStatsScenario() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 to-secondary-600">
      <AboutStats stats={{ eventsCreated: 1284, activeUsers: 356, countries: 12 }} />
      <div className="mx-auto max-w-6xl px-6 py-10 text-white">
        <h1 className="text-xl font-semibold">About statistics · preview</h1>
        <p className="mt-2 text-white/80">Sample values above. Zero and large values below. Reload to replay the animation; reduced motion keeps the illustrations still.</p>
      </div>
      <AboutStats stats={{ eventsCreated: 0, activeUsers: 0, countries: 0 }} />
      <AboutStats stats={{ eventsCreated: 1234567, activeUsers: 123456, countries: 42 }} />
    </main>
  )
}
