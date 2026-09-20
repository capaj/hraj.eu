import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { UserAvatar } from '~/components/user/UserAvatar'
import { PaymentInformationCard } from '~/components/user/PaymentInformationCard'
import { Card, CardContent } from '~/components/ui/Card'

export const Route = createFileRoute('/scenarios/profile-payment-info')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: ProfilePaymentInfoScenario
})

const scenarioUser = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com'
}

function ProfilePaymentInfoScenario() {
  const [preferredCurrency, setPreferredCurrency] = useState('CZK')
  const [revolutTag, setRevolutTag] = useState('')
  const [bankAccount, setBankAccount] = useState('')

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <UserAvatar
                  user={scenarioUser}
                  className="h-28 w-28 border-4 border-white shadow-lg"
                  fallbackClassName="text-3xl"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {scenarioUser.name}
                  </h1>
                  <p className="mt-2 text-gray-600">{scenarioUser.email}</p>
                  <p className="mt-4 text-sm text-gray-500">
                    <Trans>Payment details</Trans>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <PaymentInformationCard
            preferredCurrency={preferredCurrency}
            revolutTag={revolutTag}
            bankAccount={bankAccount}
            onCurrencyChange={setPreferredCurrency}
            onSaveRevolutTag={async (value) => {
              setRevolutTag(value)
              return true
            }}
            onSaveBankAccount={async (value) => {
              setBankAccount(value)
              return true
            }}
          />
        </div>
      </div>
    </main>
  )
}
