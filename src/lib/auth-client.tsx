import { User } from 'better-auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { createContext, useContext } from 'react'
import { AuthRouteComponent } from '~/routes/auth/$pathname'
import { auth } from './auth'
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()]
})

export const AuthContext = createContext<User | null>(null)

/**
 * only use for routes that are fine with CSR
 */
export const ProtectedRoute = (props: { children: React.ReactNode }) => {
  const session = authClient.useSession()
  if (session.isPending) {
    return <div>Loading...</div>
  }

  if (!session.data?.user) {
    return <AuthRouteComponent />
  }
  return (
    <AuthContext.Provider value={session.data?.user}>
      {props.children}
    </AuthContext.Provider>
  )
}

export const useUser = () => {
  const user = useContext(AuthContext)
  if (!user) {
    throw new Error('User not found') // should never happen-in protected route user is always in the context. If used outside, this hook will throw an error of missing context
  }
  return user
}
