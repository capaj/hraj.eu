import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

import { defaultLocale, dynamicActivate } from '~/modules/lingui/i18n'

async function prepareI18n() {
  const lang = document.documentElement.lang || defaultLocale

  try {
    await dynamicActivate(lang)
  } catch (error) {
    console.error('Failed to activate locale', error)
  }
}

prepareI18n().finally(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>
    )
  })
})
