import React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import type { AppLocale } from '~/lib/i18n'

const LANGUAGES: Record<
  AppLocale,
  { flag: string; code: string; label: string }
> = {
  en: { flag: '🇬🇧', code: 'EN', label: 'English' },
  cs: { flag: '🇨🇿', code: 'CS', label: 'Česky' }
}

const LOCALES = Object.keys(LANGUAGES) as AppLocale[]

type LanguageSelectorProps = {
  currentLocale: AppLocale
  onLocaleChange: (locale: AppLocale) => void
  triggerId: string
  fullWidth?: boolean
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLocale,
  onLocaleChange,
  triggerId,
  fullWidth = false
}) => {
  const selectedLanguage = LANGUAGES[currentLocale] ?? LANGUAGES.cs

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={triggerId}
          type="button"
          className={`inline-flex h-10 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            fullWidth ? 'w-full' : 'min-w-[5.75rem]'
          }`}
          aria-label="Language"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="text-lg leading-none">
              {selectedLanguage.flag}
            </span>
            <span>{selectedLanguage.code}</span>
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem] p-1.5">
        {LOCALES.map((locale) => {
          const language = LANGUAGES[locale]
          const isSelected = locale === currentLocale

          return (
            <DropdownMenuItem
              key={locale}
              onSelect={() => onLocaleChange(locale)}
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                isSelected
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 focus:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="text-lg leading-none">
                  {language.flag}
                </span>
                <span>{language.label}</span>
              </span>
              <span className="text-xs font-semibold text-gray-500">
                {language.code}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
