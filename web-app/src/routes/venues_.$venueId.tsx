import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { VenueDetailsPage } from '~/pages/VenueDetailsPage'
import { getVenueById } from '~/server-functions/getVenueById'
import { getVenueHistory } from '~/server-functions/getVenueHistory'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

export const Route = createFileRoute('/venues_/$venueId')({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).max(100000).catch(1)
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, deps }) => {
    const [venue, history] = await Promise.all([
      getVenueById({ data: params.venueId }),
      getVenueHistory({ data: { venueId: params.venueId, page: deps.page } })
    ])
    return { venue, history }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const venue = loaderData.venue
    const path = `/venues/${encodeURIComponent(venue.id)}`
    return {
      meta: buildSeoMeta({
        title: `${venue.name} | ${SITE_NAME}`,
        description:
          venue.description ||
          [venue.name, venue.address, venue.city].filter(Boolean).join(', '),
        url: `${SITE_URL}${path}`
      }),
      links: [canonicalLink(path)]
    }
  },
  component: VenueDetailsRoute
})

function VenueDetailsRoute() {
  const { venue, history } = Route.useLoaderData()
  return <VenueDetailsPage venue={venue} history={history} />
}
