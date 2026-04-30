import { createServerFn } from '@tanstack/react-start'
import { Event, Venue } from '../types'

type LandingPageInput = {
  citySlug: string
  sportSlug?: string
}

export type SeoLandingPageLink = {
  city: string
  citySlug: string
  country?: string
  sportId?: string
  sportName?: string
  sportSlug?: string
  eventCount: number
  venueCount: number
}

export type SeoLandingPageData = {
  city: string
  citySlug: string
  country?: string
  sportId?: string
  sportName?: string
  sportSlug?: string
  events: Event[]
  venues: Venue[]
  cityLinks: SeoLandingPageLink[]
  sportLinks: SeoLandingPageLink[]
}

export const getSeoLandingPageData = createServerFn({ method: 'GET' })
  .inputValidator((input: LandingPageInput) => input)
  .handler(async ({ data }) => {
    const { querySeoLandingPageData } = await import('./seoLandingPageQueries')
    return querySeoLandingPageData(data)
  })
