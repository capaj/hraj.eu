import { msg } from '@lingui/core/macro'
import { i18n } from '~/lib/i18n'
import { createFileRoute } from '@tanstack/react-router'
import { DiscoverPage } from '../pages/DiscoverPage'
import { getEvents } from '~/server-functions/getEvents'
import { getVenues } from '~/server-functions/getVenues'
import { getUserById } from '~/server-functions/getUserById'
import { authClient } from '~/lib/auth-client'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

const titleMessage = msg`Find amateur team sports games near you | ${SITE_NAME}`
const descriptionMessage = msg`Join local amateur players for football, futsal, volleyball, basketball, and other team sports. Find open games, meet new people, and play more often.`

export const Route = createFileRoute('/')({
  loader: async () => {
    // Load upcoming events plus only recent past events for landing page
    const session = await authClient.getSession()
    const [events, venues] = await Promise.all([
      getEvents({ data: { pastEventsLimit: 12 } }),
      getVenues()
    ])

    let user = null
    if (session.data?.user) {
      user = await getUserById({ data: session.data.user.id })
    }

    return { events, venues, user }
  },
  head: () => {
    const title = i18n._(titleMessage)
    const description = i18n._(descriptionMessage)
    return {
      meta: [
        ...buildSeoMeta({
          title,
          description,
          url: SITE_URL
        }),
        {
          'script:ld+json': {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
            description,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/?sport={sport}`,
              'query-input': 'name=sport'
            }
          }
        } as any
      ],
      links: [canonicalLink('/')]
    }
  },
  component: DiscoverPage
})
