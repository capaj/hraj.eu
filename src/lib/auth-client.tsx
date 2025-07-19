import { User } from 'better-auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { createContext, useContext } from 'react'
import { AuthCard } from '~/routes/auth/$pathname'
import { auth } from './auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()]
})

export const AuthContext = createContext<User | null>(null)

export const ProtectedRoute = (props: { children: React.ReactNode }) => {
  const session = authClient.useSession()
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
