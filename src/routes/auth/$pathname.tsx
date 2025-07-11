import { AuthCard } from '@daveyplate/better-auth-ui'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/$pathname')({
  component: RouteComponent
})

function RouteComponent() {
  const { pathname } = Route.useParams()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600">
      <main className="container flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AuthCard
          pathname={pathname}
          socialLayout="grid"
          classNames={{
            base: 'bg-white',
            content: 'bg-white/10',
            description: 'text-white',
            footer: 'bg-white',
            footerLink: 'bg-white',
            continueWith: 'bg-white',

            header: 'bg-white',
            separator: 'bg-white'
          }}
        />
      </main>
    </div>
  )
}
