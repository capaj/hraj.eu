import { createFileRoute } from '@tanstack/react-router'
import { EditEventPage } from '../pages/EditEventPage'
import { getEventById } from '~/server-functions/getEventById'

export const Route = createFileRoute('/edit-event/$eventId')({
  loader: async ({ params }) => {
    const event = await getEventById({ data: params.eventId })
    return { event }
  },
  component: () => {
    const { event } = Route.useLoaderData()
    return <EditEventPage event={event} />
  }
})
