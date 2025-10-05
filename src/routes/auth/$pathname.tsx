import { createFileRoute } from '@tanstack/react-router'
import { AuthCard } from '~/components/auth/AuthCard'

const AuthRouteComponent = () => {
  const { pathname } = Route.useParams()
  return <AuthCard pathname={pathname} />
}

export const Route = createFileRoute('/auth/$pathname')({
  component: AuthRouteComponent
})
