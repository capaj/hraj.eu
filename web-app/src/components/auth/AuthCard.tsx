import { AuthView } from '@daveyplate/better-auth-ui'

type AuthCardProps = {
  pathname: string
}

export function AuthCard({ pathname }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthView
          pathname={pathname}
          socialLayout="grid"
          className="auth-card"
          classNames={{
            base: 'bg-white shadow-2xl rounded-xl border-0 overflow-hidden py-8 px-4',
            content: 'p-4',
            header: 'text-center mb-8',
            footer: 'text-center mt-8 text-gray-600 flex flex-col gap-2',
            continueWith: 'text-gray-500 text-sm',
            separator: 'border-gray-200'
          }}
          cardHeader={
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Welcome</h1>
              <p className="text-gray-500 text-sm">
                Sign in to your account to continue
              </p>
            </div>
          }
        />
      </div>
    </div>
  )
}
