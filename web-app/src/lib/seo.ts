export const SITE_URL = 'https://hraj.eu'
export const SITE_NAME = 'hraj.eu'
export const DEFAULT_TITLE = 'hraj.eu - Find people to play team sports with'
export const DEFAULT_DESCRIPTION =
  'Find amateur team sports games near you. Join local football, volleyball, basketball, futsal, and other games with people who want to play.'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/android-chrome-512x512.png`

type SeoMetaOptions = {
  title?: string
  description?: string
  url?: string
  image?: string
  type?: 'website' | 'profile'
}

export function buildSeoMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  url = SITE_URL,
  image = DEFAULT_OG_IMAGE,
  type = 'website'
}: SeoMetaOptions = {}) {
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image }
  ]
}

export function canonicalLink(pathname: string) {
  return {
    rel: 'canonical',
    href: new URL(pathname, SITE_URL).toString()
  }
}
