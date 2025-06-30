import { createFileRoute } from '@tanstack/react-router'
import { EventDetailsPage } from '../../pages/EventDetailsPage'
import { getEventById, getVenues } from '../../lib/server-functions'

export const Route = createFileRoute('/events/$eventId')({
  loader: async ({ params }) => {
    // Load the specific event and its venue
    const event = await getEventById({ data: params.eventId })
    const venues = await getVenues()
    const venue = venues.find((v: any) => v.id === event.venueId)

    return {
      event,
      venue
    }
  },
  component: EventDetailsPage
})
