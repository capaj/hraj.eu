import { i18n } from '@lingui/core'

export const locales = {
  en: 'English',
  cs: 'Czech'
} as const

export type Locale = keyof typeof locales

export const defaultLocale: Locale = 'en'

export const isLocaleValid = (locale: string): locale is Locale =>
  locale in locales

type CatalogModule = { messages: Record<string, string> }

const catalogs = import.meta.glob<CatalogModule>(
  '../../../app/locales/*.po'
)

const CATALOG_PATH_PREFIX = '../../../app/locales'

function getCatalogLoader(locale: Locale) {
  return catalogs[`${CATALOG_PATH_PREFIX}/${locale}.po`]
}

export async function dynamicActivate(locale: string) {
  const normalizedLocale = (locale || '').toLowerCase()
  const targetLocale = isLocaleValid(normalizedLocale)
    ? normalizedLocale
    : defaultLocale

  const hasMessagesLoaded = Boolean(i18n.messages[targetLocale])
  if (i18n.locale === targetLocale && hasMessagesLoaded) {
    return
  }

  const loader = getCatalogLoader(targetLocale)

  if (!loader) {
    throw new Error(`Missing Lingui catalog for locale: ${targetLocale}`)
  }

  const { messages } = await loader()
  i18n.load(targetLocale, messages)
  i18n.activate(targetLocale)
}
