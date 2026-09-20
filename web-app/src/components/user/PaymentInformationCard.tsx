import { useState } from 'react'
import { msg, plural } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import {
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Edit3,
  Globe,
  Save
} from 'lucide-react'
import { BankAccountHint } from './BankAccountHint'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { EU_CURRENCIES } from '../../lib/constants'
import { i18n } from '~/lib/i18n'

type Currency = (typeof EU_CURRENCIES)[number]
type Country = Currency['countries'][number]

const currencyNameMessages = {
  EUR: msg`Euro`,
  BGN: msg`Bulgarian Lev`,
  CZK: msg`Czech Koruna`,
  DKK: msg`Danish Krone`,
  HUF: msg`Hungarian Forint`,
  PLN: msg`Polish Złoty`,
  RON: msg`Romanian Leu`,
  SEK: msg`Swedish Krona`,
  HRK: msg`Croatian Kuna`
} as const

const countryNameMessages = {
  Austria: msg`Austria`,
  Belgium: msg`Belgium`,
  Cyprus: msg`Cyprus`,
  Estonia: msg`Estonia`,
  Finland: msg`Finland`,
  France: msg`France`,
  Germany: msg`Germany`,
  Greece: msg`Greece`,
  Ireland: msg`Ireland`,
  Italy: msg`Italy`,
  Latvia: msg`Latvia`,
  Lithuania: msg`Lithuania`,
  Luxembourg: msg`Luxembourg`,
  Malta: msg`Malta`,
  Netherlands: msg`Netherlands`,
  Portugal: msg`Portugal`,
  Slovakia: msg`Slovakia`,
  Slovenia: msg`Slovenia`,
  Spain: msg`Spain`,
  Bulgaria: msg`Bulgaria`,
  'Czech Republic': msg`Czech Republic`,
  Denmark: msg`Denmark`,
  Hungary: msg`Hungary`,
  Poland: msg`Poland`,
  Romania: msg`Romania`,
  Sweden: msg`Sweden`,
  Croatia: msg`Croatia`
} as const

function getCurrencyName(currency: Currency) {
  return i18n._(currencyNameMessages[currency.code])
}

function getCountryName(country: Country) {
  return i18n._(countryNameMessages[country])
}

export interface PaymentInformationCardProps {
  preferredCurrency: string
  revolutTag?: string
  bankAccount?: string
  onCurrencyChange: (currency: string) => void
  onSaveRevolutTag: (revolutTag: string) => Promise<boolean>
  onSaveBankAccount: (bankAccount: string) => Promise<boolean>
}

export function PaymentInformationCard({
  preferredCurrency,
  revolutTag = '',
  bankAccount = '',
  onCurrencyChange,
  onSaveRevolutTag,
  onSaveBankAccount
}: PaymentInformationCardProps) {
  const [isEditingRevTag, setIsEditingRevTag] = useState(false)
  const [isEditingBankAccount, setIsEditingBankAccount] = useState(false)
  const [editedRevTag, setEditedRevTag] = useState(revolutTag)
  const [editedBankAccount, setEditedBankAccount] = useState(bankAccount)

  const selectedCurrency = EU_CURRENCIES.find(
    (currency) => currency.code === preferredCurrency
  )

  const handleCancelRevTag = () => {
    setEditedRevTag(revolutTag)
    setIsEditingRevTag(false)
  }

  const handleCancelBankAccount = () => {
    setEditedBankAccount(bankAccount)
    setIsEditingBankAccount(false)
  }

  const handleSaveRevTag = async () => {
    if (await onSaveRevolutTag(editedRevTag)) {
      setIsEditingRevTag(false)
    }
  }

  const handleSaveBankAccount = async () => {
    if (await onSaveBankAccount(editedBankAccount)) {
      setIsEditingBankAccount(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <CreditCard size={20} className="mr-2" />
          <Trans>Payment Information</Trans>
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          <Trans>
            Add your payment details and currency preference for easy event
            transactions
          </Trans>
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          <div>
            <h4 className="text-md font-semibold text-gray-900 flex items-center mb-4">
              <Globe size={18} className="mr-2 text-primary-600" />
              <Trans>Currency Preference</Trans>
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              <Trans>Choose your preferred currency for event pricing</Trans>
            </p>

            <div className="relative">
              <select
                value={preferredCurrency}
                onChange={(event) => onCurrencyChange(event.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white pr-10"
              >
                {EU_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {getCurrencyName(currency)} (
                    {currency.code}) -{' '}
                    {currency.countries
                      .slice(0, 2)
                      .map(getCountryName)
                      .join(', ')}
                    {currency.countries.length > 2 && (
                      <>
                        {' '}
                        {i18n._(msg`+{count} more`.id, {
                          count: currency.countries.length - 2
                        })}
                      </>
                    )}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {selectedCurrency && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-sm text-blue-800">
                  <Check size={16} className="mr-2 text-blue-600" />
                  <span>
                    <Trans>Selected:</Trans>{' '}
                    <strong>
                      {selectedCurrency.symbol}{' '}
                      {getCurrencyName(selectedCurrency)}
                    </strong>{' '}
                    -{' '}
                    {plural(selectedCurrency.countries.length, {
                      one: 'Used in # country',
                      few: 'Used in # countries',
                      many: 'Used in # countries',
                      other: 'Used in # countries'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Trans>Revolut Tag</Trans>
              </label>
              {!isEditingRevTag ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingRevTag(true)}
                >
                  <Edit3 size={14} className="mr-1" />
                  <Trans>Edit</Trans>
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelRevTag}
                  >
                    <Trans>Cancel</Trans>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveRevTag}
                  >
                    <Save size={14} className="mr-1" />
                    <Trans>Save</Trans>
                  </Button>
                </div>
              )}
            </div>

            {isEditingRevTag ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  value={editedRevTag}
                  onChange={(event) => setEditedRevTag(event.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={i18n._(msg`username`)}
                  autoFocus
                />
              </div>
            ) : (
              <div className="py-2 text-gray-900">
                {revolutTag ? `@${revolutTag}` : i18n._(msg`Not specified`)}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              <Trans>Your Revolut username for quick payments</Trans>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Trans>Czech Bank Account</Trans>
              </label>
              {!isEditingBankAccount ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBankAccount(true)}
                >
                  <Edit3 size={14} className="mr-1" />
                  <Trans>Edit</Trans>
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelBankAccount}
                  >
                    <Trans>Cancel</Trans>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveBankAccount}
                  >
                    <Save size={14} className="mr-1" />
                    <Trans>Save</Trans>
                  </Button>
                </div>
              )}
            </div>

            {isEditingBankAccount ? (
              <input
                type="text"
                value={editedBankAccount}
                onChange={(event) => setEditedBankAccount(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                placeholder="123456789/0100"
                autoFocus
              />
            ) : (
              <div className="py-2 text-gray-900 font-mono">
                {bankAccount || i18n._(msg`Not specified`)}
              </div>
            )}

            <BankAccountHint />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Building2
                size={16}
                className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  <Trans>Payment Security</Trans>
                </p>
                <p>
                  <Trans>
                    Your saved bank account is displayed on events you
                    organize so players can pay you.
                  </Trans>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
