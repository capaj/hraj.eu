import { Link, useNavigate } from '@tanstack/react-router'
import type React from 'react'
import { MapPin, Trophy, Users } from 'lucide-react'
import { EventCard } from '../components/events/EventCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { authClient } from '../lib/auth-client'
import { joinEvent } from '~/server-functions/joinEvent'
import { SPORTS } from '../lib/constants'
import type { SeoLandingPageData } from '~/server-functions/getSeoLandingPageData'

type SeoLandingPageProps = {
  data: SeoLandingPageData
}

export function SeoLandingPage({ data }: SeoLandingPageProps) {
  const navigate = useNavigate()
  const session = authClient.useSession()

  const title = data.sportName
    ? `Play ${data.sportName} in ${data.city}`
    : `Find amateur sports games in ${data.city}`

  const subtitle = data.sportName
    ? `Meet local amateur ${data.sportName.toLowerCase()} players, join upcoming games, and find places to play in ${data.city}.`
    : `Join local amateur players, discover team sports events, and find places to play in ${data.city}.`

  const handleJoinEvent = async (eventId: string) => {
    if (!session.data?.user?.id) {
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    await joinEvent({ data: { eventId } })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600">
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl text-white">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="success">{data.city}</Badge>
              {data.country && <Badge variant="info">{data.country}</Badge>}
              {data.sportName && <Badge variant="warning">{data.sportName}</Badge>}
            </div>
            <h1 className="text-4xl font-bold tracking-normal md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-lg text-white/85">{subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/">
                <Button variant="secondary">Browse all games</Button>
              </Link>
              <Link to="/create">
                <Button
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Create a game
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat icon={<Trophy size={20} />} label="Upcoming games" value={data.events.length} />
            <Stat icon={<MapPin size={20} />} label="Places to play" value={data.venues.length} />
            <Stat
              icon={<Users size={20} />}
              label="Sports covered"
              value={new Set(data.venues.flatMap((venue) => venue.sports)).size}
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Upcoming games
            </h2>
            {data.sportLinks.length > 0 && !data.sportName && (
              <div className="hidden flex-wrap gap-2 md:flex">
                {data.sportLinks.slice(0, 8).map((link) => (
                  <Link
                    key={`${link.citySlug}-${link.sportSlug}`}
                    to="/$citySlug/$sportSlug"
                    params={{
                      citySlug: link.citySlug,
                      sportSlug: link.sportSlug!
                    }}
                  >
                    <Badge variant="info">{link.sportName}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {data.events.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  venues={data.venues}
                  onJoin={handleJoinEvent}
                  currentUserId={session.data?.user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-gray-700">
              No upcoming games are listed here yet. The venues below support
              this page, and new games will appear here automatically.
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Places to play in {data.city}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.venues.slice(0, 12).map((venue) => (
              <Card key={venue.id}>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {venue.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{venue.address}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {venue.sports.slice(0, 5).map((sportId) => {
                      const sport = SPORTS.find((candidate) => candidate.id === sportId)
                      return sport ? (
                        <Badge key={sport.id} variant="info">
                          {sport.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
          {data.sportLinks.length > 0 && (
            <LinkList
              title={`Sports in ${data.city}`}
              links={data.sportLinks.map((link) => ({
                label: link.sportName || '',
                to: `/${link.citySlug}/${link.sportSlug}`,
                count: link.eventCount || link.venueCount
              }))}
            />
          )}
          <LinkList
            title="Other active cities"
            links={data.cityLinks
              .filter((link) => link.citySlug !== data.citySlug)
              .slice(0, 12)
              .map((link) => ({
                label: link.city,
                to: `/cities/${link.citySlug}`,
                count: link.eventCount || link.venueCount
              }))}
          />
        </div>
      </section>
    </main>
  )
}

function Stat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/15 p-4 text-white backdrop-blur">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-white/80">{label}</div>
        </div>
      </div>
    </div>
  )
}

function LinkList({
  title,
  links
}: {
  title: string
  links: Array<{ label: string; to: string; count: number }>
}) {
  if (links.length === 0) return null

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.to}
            href={link.to}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-primary-300 hover:text-primary-700"
          >
            {link.label} ({link.count})
          </a>
        ))}
      </div>
    </div>
  )
}
