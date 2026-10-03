import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '../pages/HomePage'
import { getUpcomingEvents } from '~/server-functions/getUpcomingEvents'
import { getAppStats } from '~/server-functions/getAppStats'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

const titleMessage = msg`About ${SITE_NAME} | Meet people through amateur team sports`
const descriptionMessage = msg`hraj.eu helps amateur players find local games, organize team sports, and meet new people through football, volleyball, basketball, futsal, and more.`

export const Route = createFileRoute('/about')({
  loader: async () => {
    // Load data for home page - upcoming events and stats
    const [upcomingEvents, stats] = await Promise.all([
      getUpcomingEvents({ data: 3 }),
      getAppStats()
    ])

    return {
      upcomingEvents,
      stats
    }
  },
  head: () => {
    const title = i18n._(titleMessage)
    const description = i18n._(descriptionMessage)
    return {
      meta: [
        ...buildSeoMeta({
          title,
          description,
          url: `${SITE_URL}/about`
        }),
        {
          'script:ld+json': {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/android-chrome-512x512.png`,
            description
          }
        } as any
      ],
      links: [canonicalLink('/about')]
    }
  },
  component: AboutPage
})
