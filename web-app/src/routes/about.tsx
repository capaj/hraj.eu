import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '../pages/HomePage'
import { getUpcomingEvents } from '~/server-functions/getUpcomingEvents'
import { getAppStats } from '~/server-functions/getAppStats'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

const title = `About ${SITE_NAME} | Meet people through amateur team sports`
const description =
  'hraj.eu helps amateur players find local games, organize team sports, and meet new people through football, volleyball, basketball, futsal, and more.'

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
  head: () => ({
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
          description
        }
      } as any
    ],
    links: [canonicalLink('/about')]
  }),
  component: AboutPage
})
