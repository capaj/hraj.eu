import { createFileRoute } from '@tanstack/react-router'
import { EventDetailsPage } from '../../pages/EventDetailsPage'
import { getEventById } from '~/server-functions/getEventById'
import { getVenues } from '~/server-functions/getVenues'
import { getUserById } from '~/server-functions/getUserById'
import { getUsersByIds } from '~/server-functions/getUsersByIds'
import { getRequestOrigin } from '~/server-functions/getRequestOrigin'
import { getEventComments } from '~/server-functions/getEventComments'
import { SPORTS } from '~/lib/constants'

export const Route = createFileRoute('/events/$eventId')({
  ssr: true,
  loader: async ({ params }) => {
    const event = await getEventById({ data: params.eventId })
    const venues = await getVenues()
    const venue = venues.find((v: any) => v.id === event.venueId)
    const organizer = await getUserById({ data: event.organizerId })
    const origin = await getRequestOrigin()

    const participantIds = [...event.participants, ...(event.waitlist || [])]
    const participants = participantIds.length > 0
      ? await getUsersByIds({ data: participantIds })
      : []
    const comments = await getEventComments({ data: event.id })

    return {
      event,
      venue,
      organizer,
      participants,
      origin,
      comments
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
    const sport = SPORTS.find((s) => s.id === event.sport)
    const sportName = sport?.name ?? event.sport

    const start = (() => {
      const date = new Date(event.date)
      const [hours, minutes] = String(event.startTime || '00:00')
        .split(':')
        .map((v) => Number(v || 0))
      date.setHours(hours, minutes, 0, 0)
      return date
    })()
    const end = new Date(start.getTime() + (event.duration || 0) * 60 * 1000)

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
    const seoTitleParts = [
      sportName ? `${sportName} game` : null,
      title,
      venue?.city ? venue.city : null
    ].filter(Boolean)
    const seoTitle = `${seoTitleParts.join(' - ')} | hraj.eu`
    const isPubliclyIndexable =
      event.isPublic &&
      event.status !== 'cancelled' &&
      (!event.coreGroupExclusiveUntil ||
        new Date(event.coreGroupExclusiveUntil).getTime() <= Date.now())
    const priceParticipants = event.idealParticipants || event.minParticipants
    const pricePerPlayer =
      event.price && priceParticipants > 0
        ? Number((event.price / priceParticipants).toFixed(2))
        : undefined

    const eventJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: title,
      description,
      sport: sportName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus:
        event.status === 'cancelled'
          ? 'https://schema.org/EventCancelled'
          : 'https://schema.org/EventScheduled',
      url,
      image: ogImage,
      maximumAttendeeCapacity: event.maxParticipants,
      location: venue
        ? {
            '@type': 'Place',
            name: venue.name,
            address: {
              '@type': 'PostalAddress',
              streetAddress: venue.address,
              addressLocality: venue.city,
              addressCountry: venue.country
            },
            geo:
              venue.lat && venue.lng
                ? {
                    '@type': 'GeoCoordinates',
                    latitude: venue.lat,
                    longitude: venue.lng
                  }
                : undefined
          }
        : undefined,
      organizer: loaderData?.organizer
        ? {
            '@type': 'Person',
            name: loaderData.organizer.name
          }
        : {
            '@type': 'Organization',
            name: 'hraj.eu',
            url: origin
          },
      offers: pricePerPlayer
        ? {
            '@type': 'Offer',
            price: pricePerPlayer,
            priceCurrency: event.currency || 'CZK',
            availability:
              event.participants.length >= event.maxParticipants
                ? 'https://schema.org/SoldOut'
                : 'https://schema.org/InStock',
            url
          }
        : undefined
    }

    return {
      meta: [
        { title: seoTitle },
        { name: 'description', content: description },
        ...(isPubliclyIndexable ? [] : [{ name: 'robots', content: 'noindex' }]),
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
        { property: 'fb:app_id', content: '311467912374535' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: ogTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
        { 'script:ld+json': eventJsonLd } as any
      ],
      links: [{ rel: 'canonical', href: url }]
    }
  },
  component: EventDetailsPage
})
