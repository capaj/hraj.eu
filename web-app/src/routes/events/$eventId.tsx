import { createFileRoute } from '@tanstack/react-router'
import { EventDetailsPage } from '../../pages/EventDetailsPage'
import { getEventById } from '~/server-functions/getEventById'
import { getVenues } from '~/server-functions/getVenues'
import { getUserById } from '~/server-functions/getUserById'
import { getUsersByIds } from '~/server-functions/getUsersByIds'

export const Route = createFileRoute('/events/$eventId')({
  loader: async ({ params }) => {
    const event = await getEventById({ data: params.eventId })
    const venues = await getVenues()
    const venue = venues.find((v: any) => v.id === event.venueId)
    const organizer = await getUserById({ data: event.organizerId })
    
    const participantIds = [...event.participants]
    const participants = participantIds.length > 0
      ? await getUsersByIds({ data: participantIds })
      : []

    return {
      event,
      venue,
      organizer,
      participants
    }
  },
  component: EventDetailsPage
})
