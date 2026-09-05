import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { VenuesPage } from '../pages/VenuesPage'
import { getVenues } from '~/server-functions/getVenues'
import {
  getVenueEventSubscriptions,
  updateVenueEventSubscription
} from '~/server-functions/venueEventSubscriptions'
import { buildSeoMeta, canonicalLink, SITE_NAME, SITE_URL } from '~/lib/seo'

const title = `Sports venues and places to play | ${SITE_NAME}`
const description =
  'Browse sports venues on a map and subscribe to email alerts when new amateur team sports events are created at your favorite places.'

export const Route = createFileRoute('/venues')({
  loader: async () => {
    const [venues, subscriptions] = await Promise.all([
      getVenues(),
      getVenueEventSubscriptions()
    ])

    return { venues, subscriptions }
  },
  head: () => ({
    meta: buildSeoMeta({
      title,
      description,
      url: `${SITE_URL}/venues`
    }),
    links: [canonicalLink('/venues')]
  }),
  component: VenuesRoute
})

function VenuesRoute() {
  const navigate = useNavigate()
  const { venues, subscriptions } = Route.useLoaderData()

  return (
    <VenuesPage
      venues={venues}
      initialSubscribedVenueIds={subscriptions.venueIds}
      isAuthenticated={subscriptions.isAuthenticated}
      onSignIn={() =>
        navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      }
      onSubscriptionChange={async (venueId, subscribed) => {
        await updateVenueEventSubscription({ data: { venueId, subscribed } })
      }}
    />
  )
}
