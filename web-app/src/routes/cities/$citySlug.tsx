import { t } from '@lingui/core/macro'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { SeoLandingPage } from '../../pages/SeoLandingPage'
import { getSeoLandingPageData } from '~/server-functions/getSeoLandingPageData'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

export const Route = createFileRoute('/cities/$citySlug')({
  loader: async ({ params }) => {
    const data = await getSeoLandingPageData({
      data: { citySlug: params.citySlug }
    })
    if (!data) throw notFound()
    return data
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: t`City not found | ${SITE_NAME}` },
          { name: 'robots', content: 'noindex' }
        ]
      }
    }

    const city = loaderData.city
    const title = t`Play amateur team sports in ${city} | ${SITE_NAME}`
    const description = t`Find amateur team sports games in ${city}. Join local players, discover upcoming football, volleyball, basketball, futsal, and other games, and meet people who want to play.`
    const url = `${SITE_URL}/cities/${loaderData.citySlug}`

    return {
      meta: [
        ...buildSeoMeta({ title, description, url }),
        {
          'script:ld+json': {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title,
            description,
            url,
            about: {
              '@type': 'SportsActivityLocation',
              name: t`Amateur sports in ${city}`
            }
          }
        } as any
      ],
      links: [canonicalLink(`/cities/${loaderData.citySlug}`)]
    }
  },
  component: CityLandingRoute
})

function CityLandingRoute() {
  const data = Route.useLoaderData()
  return <SeoLandingPage data={data} />
}
