import type { ReactNode } from 'react'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Star
} from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { VenueMap } from '~/components/venues/VenueMap'
import {
  getEventStatusName,
  getFacilityName,
  getSportName,
  getVenueTypeName
} from '~/lib/localizedNames'
import { i18n } from '~/lib/i18n'
import type { VenueHistory } from '~/server-functions/venueHistory'
import { VENUE_HISTORY_PAGE_SIZE } from '~/lib/venueHistory'
import type { Venue } from '~/types'

type Props = {
  venue: Venue
  history: VenueHistory
  onHistoryPageChange?: (page: number) => void
}

function Panel({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  )
}

function websiteUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

export function VenueDetailsPage({
  venue,
  history,
  onHistoryPageChange
}: Props) {
  useLingui()
  const locale = i18n.locale
  const address = [venue.address, venue.city, venue.country]
    .filter(Boolean)
    .join(', ')
  const website = websiteUrl(venue.contactInfo?.website)
  const pages = Math.max(1, Math.ceil(history.total / VENUE_HISTORY_PAGE_SIZE))
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: venue.priceRange?.currency || venue.currency
    }).format(value)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 5 + index))
    return {
      key: new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' })
        .format(date)
        .toLowerCase(),
      label: new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        timeZone: 'UTC'
      }).format(date)
    }
  })
  let price: ReactNode = <Trans>Price not listed</Trans>
  if (venue.priceRange) {
    price = money(venue.priceRange.min)
    if (venue.priceRange.max !== venue.priceRange.min) {
      price = `${money(venue.priceRange.min)} – ${money(venue.priceRange.max)}`
    }
  } else if (venue.price > 0) {
    price = money(venue.price)
  }
  const hasLocation =
    Number.isFinite(venue.lat) &&
    Number.isFinite(venue.lng) &&
    (venue.lat !== 0 || venue.lng !== 0)
  const pageLink = (page: number, label: ReactNode) => (
    <Link
      to="/venues/$venueId"
      params={{ venueId: venue.id }}
      search={{ page }}
      onClick={
        onHistoryPageChange
          ? (event) => {
              event.preventDefault()
              onHistoryPageChange(page)
            }
          : undefined
      }
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {label}
    </Link>
  )

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/venues"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/90 hover:underline"
          >
            <ArrowLeft size={16} />
            <Trans>All venues</Trans>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold sm:text-4xl">{venue.name}</h1>
            {venue.isVerified && (
              <CheckCircle2
                size={24}
                className="shrink-0"
                aria-label={i18n._(msg`Verified venue`)}
              />
            )}
          </div>
          {address && (
            <p className="mt-3 flex items-start gap-2 text-white/90">
              <MapPin size={18} className="mt-0.5 shrink-0" />
              {address}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>{getVenueTypeName(venue.type)}</Badge>
            {venue.sports.map((sport) => (
              <Badge key={sport} variant="info">
                {getSportName(sport)}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {venue.photos.length > 0 && (
          <section
            aria-label={i18n._(msg`Venue photos`)}
            className={`grid gap-3 ${venue.photos.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}
          >
            {venue.photos.map((photo, index) => (
              <a
                key={`${photo}-${index}`}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={photo}
                  alt={`${venue.name} — ${index + 1}`}
                  className="h-56 w-full rounded-2xl bg-gray-100 object-cover"
                />
              </a>
            ))}
          </section>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <Panel title={<Trans>About the venue</Trans>}>
              {venue.description ? (
                <p className="whitespace-pre-line text-gray-600">
                  {venue.description}
                </p>
              ) : (
                <p className="text-gray-500">
                  <Trans>No description available.</Trans>
                </p>
              )}
              {venue.facilities.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 font-medium text-gray-900">
                    <Trans>Facilities</Trans>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {venue.facilities.map((facility) => (
                      <Badge key={facility}>{getFacilityName(facility)}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {venue.rating != null && (
                <p className="mt-5 flex items-center gap-2 text-sm text-gray-600">
                  <Star size={16} className="text-amber-500" />
                  {venue.rating.toFixed(1)} / 5
                  {venue.totalRatings != null && (
                    <span>({venue.totalRatings})</span>
                  )}
                </p>
              )}
            </Panel>

            <Panel title={<Trans>Location & access</Trans>}>
              {address && <p className="mb-4 text-gray-600">{address}</p>}
              {venue.accessInstructions && (
                <div className="mb-4 rounded-xl bg-primary-50 p-4">
                  <h3 className="mb-1 font-medium text-gray-900">
                    <Trans>Access Instructions</Trans>
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                    {venue.accessInstructions}
                  </p>
                </div>
              )}
              {hasLocation && (
                <>
                  <div className="h-[360px] overflow-hidden rounded-xl">
                    <VenueMap venues={[venue]} />
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-primary-700 hover:underline"
                  >
                    <Trans>Get directions</Trans>
                  </a>
                </>
              )}
              {venue.orientationPlan && (
                <div className="mt-5">
                  <h3 className="mb-2 font-medium text-gray-900">
                    <Trans>Orientation plan</Trans>
                  </h3>
                  <a
                    href={venue.orientationPlan}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={venue.orientationPlan}
                      alt={i18n._(msg`Orientation plan`)}
                      className="max-h-96 rounded-xl object-contain"
                    />
                  </a>
                </div>
              )}
            </Panel>
          </div>

          <aside className="min-w-0 space-y-6">
            <Panel title={<Trans>Contact</Trans>}>
              <div className="space-y-4 break-words text-sm">
                {venue.contactInfo?.phone && (
                  <a
                    href={`tel:${venue.contactInfo.phone}`}
                    className="flex items-center gap-2 text-primary-700 hover:underline"
                  >
                    <Phone size={17} className="shrink-0" />
                    {venue.contactInfo.phone}
                  </a>
                )}
                {venue.contactInfo?.email && (
                  <a
                    href={`mailto:${venue.contactInfo.email}`}
                    className="flex items-start gap-2 text-primary-700 hover:underline"
                  >
                    <Mail size={17} className="shrink-0" />
                    <span className="min-w-0">{venue.contactInfo.email}</span>
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-primary-700 hover:underline"
                  >
                    <Globe size={17} className="shrink-0" />
                    <span className="min-w-0">
                      {venue.contactInfo?.website}
                    </span>
                  </a>
                )}
                {!venue.contactInfo?.phone &&
                  !venue.contactInfo?.email &&
                  !website && (
                    <p className="text-gray-500">
                      <Trans>No contact details available.</Trans>
                    </p>
                  )}
              </div>
            </Panel>
            <Panel title={<Trans>Pricing</Trans>}>
              <p className="text-lg font-semibold text-gray-900">{price}</p>
            </Panel>
            {venue.openingHours &&
              Object.keys(venue.openingHours).length > 0 && (
                <Panel title={<Trans>Opening hours</Trans>}>
                  <dl className="space-y-3 text-sm">
                    {days.map(({ key, label }) => {
                      if (!Object.hasOwn(venue.openingHours!, key)) return null
                      const hours = venue.openingHours![key]
                      return (
                        <div key={key} className="flex justify-between gap-3">
                          <dt className="capitalize text-gray-600">{label}</dt>
                          <dd className="text-gray-900">
                            {hours ? (
                              `${hours.open} – ${hours.close}`
                            ) : (
                              <Trans>Closed</Trans>
                            )}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </Panel>
              )}
          </aside>
          <section
            id="event-history"
            className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex items-start gap-3">
              <CalendarDays size={24} className="mt-1 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  <Trans>Past events</Trans>
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  <Trans>{history.total} public events at this venue</Trans>
                </p>
              </div>
            </div>
            {history.events.length === 0 ? (
              <p className="py-6 text-gray-500">
                <Trans>No past events to show.</Trans>
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {history.events.map((event) => (
                  <li key={event.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: event.id }}
                        className="font-semibold text-gray-900 hover:text-primary-700 hover:underline"
                      >
                        {event.title}
                      </Link>
                      <Badge
                        variant={
                          event.status === 'cancelled' ? 'error' : 'default'
                        }
                      >
                        {getEventStatusName(event.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {getSportName(event.sport)} ·{' '}
                      <time dateTime={`${event.date}T${event.startTime}`}>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: 'medium',
                          timeZone: 'UTC'
                        }).format(new Date(event.date))}{' '}
                        · {event.startTime}
                      </time>{' '}
                      · {event.duration} <Trans>min</Trans>
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {(pages > 1 || history.page > 1) && (
              <nav
                aria-label={i18n._(msg`Event history pages`)}
                className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5"
              >
                {history.page > 1 ? (
                  pageLink(history.page - 1, <Trans>Previous</Trans>)
                ) : (
                  <span />
                )}
                <span className="text-sm text-gray-500">
                  <Trans>
                    Page {history.page} of {pages}
                  </Trans>
                </span>
                {history.page < pages ? (
                  pageLink(history.page + 1, <Trans>Next</Trans>)
                ) : (
                  <span />
                )}
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
