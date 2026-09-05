import { useMemo, useRef, useState } from 'react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import {
  Bell,
  BellOff,
  Building2,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MapPin,
  Search,
  SlidersHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { VenueMap } from '../components/venues/VenueMap'
import { SPORTS } from '../lib/constants'
import { i18n } from '../lib/i18n'
import type { Venue } from '../types'

export type VenuesPageProps = {
  venues: Venue[]
  initialSubscribedVenueIds?: string[]
  isAuthenticated: boolean
  onSignIn: () => void
  onSubscriptionChange: (venueId: string, subscribed: boolean) => Promise<void>
}

function venueTypeLabel(type: Venue['type']) {
  switch (type) {
    case 'indoor':
      return i18n._(msg`Indoor`)
    case 'mixed':
      return i18n._(msg`Indoor & outdoor`)
    default:
      return i18n._(msg`Outdoor`)
  }
}

function searchableVenueText(venue: Venue) {
  return [venue.name, venue.address, venue.city, venue.country]
    .join(' ')
    .toLocaleLowerCase()
}

export function VenuesPage({
  venues,
  initialSubscribedVenueIds = [],
  isAuthenticated,
  onSignIn,
  onSubscriptionChange
}: VenuesPageProps) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [sport, setSport] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState<string>()
  const [subscribedVenueIds, setSubscribedVenueIds] = useState(
    () => new Set(initialSubscribedVenueIds)
  )
  const [pendingVenueIds, setPendingVenueIds] = useState(
    () => new Set<string>()
  )
  const cardRefs = useRef(new Map<string, HTMLElement>())

  const cities = useMemo(
    () =>
      [...new Set(venues.map((venue) => venue.city).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [venues]
  )

  const sports = useMemo(
    () => SPORTS.filter((candidate) => venues.some((venue) => venue.sports.includes(candidate.id))),
    [venues]
  )

  const filteredVenues = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()

    return venues.filter((venue) => {
      const matchesSearch =
        !normalizedSearch || searchableVenueText(venue).includes(normalizedSearch)
      const matchesCity = !city || venue.city === city
      const matchesSport = !sport || venue.sports.includes(sport)
      return matchesSearch && matchesCity && matchesSport
    })
  }, [city, search, sport, venues])

  const selectVenue = (venueId: string) => {
    setSelectedVenueId(venueId)
    cardRefs.current.get(venueId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  const toggleSubscription = async (venue: Venue) => {
    if (!isAuthenticated) {
      onSignIn()
      return
    }

    const shouldSubscribe = !subscribedVenueIds.has(venue.id)
    setPendingVenueIds((current) => new Set(current).add(venue.id))

    try {
      await onSubscriptionChange(venue.id, shouldSubscribe)
      setSubscribedVenueIds((current) => {
        const next = new Set(current)
        if (shouldSubscribe) next.add(venue.id)
        else next.delete(venue.id)
        return next
      })
      toast.success(
        shouldSubscribe
          ? i18n._(msg`You will receive emails about new events at this venue.`)
          : i18n._(msg`Venue emails have been turned off.`)
      )
    } catch (error) {
      console.error('Failed to update venue subscription:', error)
      toast.error(i18n._(msg`Could not update the venue subscription.`))
    } finally {
      setPendingVenueIds((current) => {
        const next = new Set(current)
        next.delete(venue.id)
        return next
      })
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <section className="bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-10 text-white sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <MapPin size={16} />
              <Trans>Places to play</Trans>
            </div>
            <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
              <Trans>Find your next venue</Trans>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">
              <Trans>
                Explore sports venues, see where they are, and get an email when
                someone creates a new event at your favorite place.
              </Trans>
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Building2 size={18} />
              <Trans>{venues.length} venues</Trans>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <MapPin size={18} />
              <Trans>{cities.length} cities</Trans>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Mail size={18} />
              <Trans>Email alerts for new events</Trans>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
              <h2 className="text-xl font-semibold text-gray-900">
                <Trans>Venue map</Trans>
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                <Trans>Select a marker to find the venue in the list.</Trans>
              </p>
            </div>
            <div className="h-[400px] bg-gray-100 lg:h-[460px]">
              <VenueMap
                venues={filteredVenues}
                selectedVenueId={selectedVenueId}
                onVenueSelect={selectVenue}
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
              <label className="relative block">
                <span className="sr-only">
                  <Trans>Search venues</Trans>
                </span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={i18n._(msg`Search by name, address, or city`)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">
                  <Trans>Filter by city</Trans>
                </span>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">{i18n._(msg`All cities`)}</option>
                  {cities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">
                  <Trans>Filter by sport</Trans>
                </span>
                <select
                  value={sport}
                  onChange={(event) => setSport(event.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">{i18n._(msg`All sports`)}</option>
                  {sports.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </label>
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                <Trans>All venues</Trans>
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                <Trans>
                  Showing {filteredVenues.length} of {venues.length} venues
                </Trans>
              </p>
            </div>
          </div>

          {filteredVenues.length > 0 ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredVenues.map((venue) => {
                const isSubscribed = subscribedVenueIds.has(venue.id)
                const isPending = pendingVenueIds.has(venue.id)
                const location = [venue.address, venue.city, venue.country]
                  .filter(Boolean)
                  .join(', ')
                let subscriptionButtonContent = <Trans>Subscribe</Trans>

                if (isPending) {
                  subscriptionButtonContent = (
                    <>
                      <LoaderCircle size={15} className="mr-1.5 animate-spin" />
                      <Trans>Updating…</Trans>
                    </>
                  )
                } else if (isSubscribed) {
                  subscriptionButtonContent = <Trans>Unsubscribe</Trans>
                }

                return (
                  <Card
                    key={venue.id}
                    className={`flex scroll-mt-24 flex-col overflow-hidden transition ${
                      venue.id === selectedVenueId
                        ? 'border-primary-400 ring-2 ring-primary-200'
                        : ''
                    }`}
                  >
                    <article
                      ref={(element) => {
                        if (element) cardRefs.current.set(venue.id, element)
                        else cardRefs.current.delete(venue.id)
                      }}
                      className="flex h-full flex-col"
                    >
                      {venue.photos[0] ? (
                        <img
                          src={venue.photos[0]}
                          alt=""
                          className="h-40 w-full bg-gray-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 text-primary-700">
                          <Building2 size={42} strokeWidth={1.5} />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {venue.name}
                            </h3>
                            {location && (
                              <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-600">
                                <MapPin size={15} className="mt-0.5 shrink-0" />
                                <span>{location}</span>
                              </p>
                            )}
                          </div>
                          {venue.isVerified && (
                            <CheckCircle2
                              size={20}
                              className="shrink-0 text-primary-600"
                              aria-label={i18n._(msg`Verified venue`)}
                            />
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge variant="default">{venueTypeLabel(venue.type)}</Badge>
                          {venue.sports.slice(0, 4).map((sportId) => {
                            const venueSport = SPORTS.find(
                              (candidate) => candidate.id === sportId
                            )
                            return venueSport ? (
                              <Badge key={sportId} variant="info">
                                {venueSport.name}
                              </Badge>
                            ) : null
                          })}
                          {venue.sports.length > 4 && (
                            <Badge variant="info">+{venue.sports.length - 4}</Badge>
                          )}
                        </div>

                        {venue.description && (
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                            {venue.description}
                          </p>
                        )}

                        <div className="mt-auto pt-5">
                          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                <Trans>New event emails</Trans>
                              </p>
                              <p
                                className={`mt-1 flex items-center gap-1.5 text-sm ${
                                  isSubscribed ? 'text-primary-700' : 'text-gray-600'
                                }`}
                              >
                                {isSubscribed ? (
                                  <>
                                    <Bell size={15} />
                                    <Trans>Subscribed</Trans>
                                  </>
                                ) : (
                                  <>
                                    <BellOff size={15} />
                                    <Trans>Not subscribed</Trans>
                                  </>
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={isSubscribed ? 'outline' : 'primary'}
                              disabled={isPending}
                              onClick={() => void toggleSubscription(venue)}
                              aria-pressed={isSubscribed}
                            >
                              {subscriptionButtonContent}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
              <MapPin size={38} className="mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                <Trans>No venues match your filters</Trans>
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                <Trans>Try another search, city, or sport.</Trans>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
