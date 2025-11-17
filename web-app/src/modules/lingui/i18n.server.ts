import { getCookies, getRequest, setCookie } from '@tanstack/react-start/server'

import {
  defaultLocale,
  dynamicActivate,
  isLocaleValid,
  type Locale
} from './i18n'

const LOCALE_COOKIE = 'locale'
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function persistLocale(locale: Locale) {
  setCookie(LOCALE_COOKIE, locale, {
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax'
  })
}

function readLocaleFromQuery(): string | null {
  const request = getRequest()
  const queryLocale = new URL(request.url).searchParams.get('locale')

  return queryLocale
}

function normalizeLocale(locale: string | null | undefined): Locale | null {
  if (!locale) {
    return null
  }

  const candidate = locale.toLowerCase()
  return isLocaleValid(candidate) ? candidate : null
}

function getLocaleFromRequest(): Locale {
  const fromQuery = normalizeLocale(readLocaleFromQuery())
  if (fromQuery) {
    persistLocale(fromQuery)
    return fromQuery
  }

  const cookies = getCookies()
  const fromCookie = normalizeLocale(cookies[LOCALE_COOKIE])
  if (fromCookie) {
    return fromCookie
  }

  persistLocale(defaultLocale)
  return defaultLocale
}

export async function setupLocaleFromRequest() {
  const locale = getLocaleFromRequest()
  await dynamicActivate(locale)
  return locale
}
