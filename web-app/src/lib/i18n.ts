import { i18n } from '@lingui/core'

import { messages as enMessages } from '../../app/locales/en.mjs'
import { messages as csMessages } from '../../app/locales/cs.mjs'

export type AppLocale = 'en' | 'cs'

const MESSAGES: Record<AppLocale, typeof enMessages> = {
  en: enMessages,
  cs: csMessages
}

export function activateLocale(locale: AppLocale) {
  i18n.loadAndActivate({ locale, messages: MESSAGES[locale] })
}

activateLocale('cs')

export { i18n }
