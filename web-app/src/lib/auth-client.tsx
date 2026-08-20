import { User } from 'better-auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { useQuery } from '@tanstack/react-query'
import { createContext, useContext } from 'react'
import { AuthCard } from '~/components/auth/AuthCard'
import { auth } from './auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), magicLinkClient()]
})

export const authSessionQueryKey = ['session'] as const

export const useAuthSession = () =>
  useQuery({
    queryKey: authSessionQueryKey,
    queryFn: () =>
      authClient.getSession({
        fetchOptions: { throw: true }
      }),
    staleTime: 60 * 1000
  })

export const AuthContext = createContext<User | null>(null)

export const ProtectedRoute = (props: { children: React.ReactNode }) => {
  const session = useAuthSession()
  if (session.isPending) {
    return <div>Loading...</div>
  }

  if (!session.data?.user) {
    return <AuthCard pathname="sign-in" />
  }
  console.log('session.data?.user', session.data?.user)
  return (
    <AuthContext.Provider value={session.data?.user}>
      {props.children}
    </AuthContext.Provider>
  )
}

export const useUser = () => {
  const user = useContext(AuthContext)
  if (!user) {
    throw new Error('User not found')
  }
  return user
}
