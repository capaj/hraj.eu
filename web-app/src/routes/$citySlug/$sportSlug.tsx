import { getSportName } from '~/lib/localizedNames'
import { t } from '@lingui/core/macro'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { SeoLandingPage } from '../../pages/SeoLandingPage'
import { getSeoLandingPageData } from '~/server-functions/getSeoLandingPageData'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

export const Route = createFileRoute('/$citySlug/$sportSlug')({
  loader: async ({ params }) => {
    const data = await getSeoLandingPageData({
      data: {
        citySlug: params.citySlug,
        sportSlug: params.sportSlug
      }
    })
    if (!data) throw notFound()
    return data
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: t`Sports page not found | ${SITE_NAME}` },
          { name: 'robots', content: 'noindex' }
        ]
      }
    }

    const city = loaderData.city
    const sportName = loaderData.sportId ? getSportName(loaderData.sportId) : (loaderData.sportName ?? '')
    const title = t`Play ${sportName} in ${city} | ${SITE_NAME}`
    const description = t`Find amateur ${sportName} games in ${city}. Join local players, discover upcoming games, and meet people who want to play.`
    const pathname = `/${loaderData.citySlug}/${loaderData.sportSlug}`
    const url = `${SITE_URL}${pathname}`

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
              '@type': 'SportsEvent',
              sport: sportName,
              location: {
                '@type': 'City',
                name: loaderData.city
              }
            }
          }
        } as any
      ],
      links: [canonicalLink(pathname)]
    }
  },
  component: SportCityLandingRoute
})

function SportCityLandingRoute() {
  const data = Route.useLoaderData()
  return <SeoLandingPage data={data} />
}
