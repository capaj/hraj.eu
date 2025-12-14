import type { LinguiConfig } from '@lingui/conf'

const config: LinguiConfig = {
  fallbackLocales: {
    default: 'en'
  },
  locales: ['en', 'cs'],
  compileNamespace: 'es',
  catalogs: [
    {
      path: '<rootDir>/app/locales/{locale}',
      include: ['src', 'app']
    }
  ]
}

export default config
