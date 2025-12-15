import { createFileRoute } from '@tanstack/react-router'
import { EventDetailsPage } from '../../pages/EventDetailsPage'
import { getEventById } from '~/server-functions/getEventById'
import { getVenues } from '~/server-functions/getVenues'
import { getUserById } from '~/server-functions/getUserById'
import { getUsersByIds } from '~/server-functions/getUsersByIds'
import { getRequestOrigin } from '~/server-functions/getRequestOrigin'

export const Route = createFileRoute('/events/$eventId')({
  ssr: true,
  loader: async ({ params }) => {
    const event = await getEventById({ data: params.eventId })
    const venues = await getVenues()
    const venue = venues.find((v: any) => v.id === event.venueId)
    const organizer = await getUserById({ data: event.organizerId })
    const origin = await getRequestOrigin()
    
    const participantIds = [...event.participants]
    const participants = participantIds.length > 0
      ? await getUsersByIds({ data: participantIds })
      : []

    return {
      event,
      venue,
      organizer,
      participants,
      origin
    }
  },
  head: ({ loaderData }) => {
    const event = loaderData?.event
    const venue = loaderData?.venue
    const origin = loaderData?.origin || 'https://hraj.eu'

    const url = event?.id ? new URL(`/events/${event.id}`, origin).toString() : origin

    const ogImage = (() => {
      if (!event?.id) return `${origin}/android-chrome-512x512.png`
      const v =
        typeof (event as any).updatedAt?.getTime === 'function'
          ? (event as any).updatedAt.getTime()
          : undefined
      const imageUrl = new URL(`/api/og/event/${event.id}`, origin)
      if (v) imageUrl.searchParams.set('v', String(v))
      return imageUrl.toString()
    })()

    if (!event) {
      return {
        meta: [
          { title: 'Event not found | hraj.eu' },
          { name: 'robots', content: 'noindex' }
        ]
      }
    }

    const title = event.title?.trim() ? event.title.trim() : 'Event'

    const start = (() => {
      const date = new Date(event.date)
      const [hours, minutes] = String(event.startTime || '00:00')
        .split(':')
        .map((v) => Number(v || 0))
      date.setHours(hours, minutes, 0, 0)
      return date
    })()

    const when = (() => {
      try {
        return new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(start)
      } catch {
        return start.toISOString()
      }
    })()

    const where = venue?.name
      ? `${venue.name}${venue.city ? `, ${venue.city}` : ''}`
      : undefined

    const fallbackDescriptionParts = [
      where ? `at ${where}` : null,
      when ? `on ${when}` : null
    ].filter(Boolean)

    const rawDescription =
      (event.description || '').trim() ||
      (fallbackDescriptionParts.length ? `${title} ${fallbackDescriptionParts.join(' ')}` : title)

    const description =
      rawDescription.length > 200 ? `${rawDescription.slice(0, 197)}...` : rawDescription

    const ogTitle = where ? `${title} @ ${where}` : title

    return {
      meta: [
        { title: `${title} | hraj.eu` },
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'hraj.eu' },
        { property: 'og:url', content: url },
        { property: 'og:title', content: ogTitle },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImage },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: ogTitle },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: ogTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage }
      ],
      links: [{ rel: 'canonical', href: url }]
    }
  },
  component: EventDetailsPage
})
