import { SPORTS } from './constants'

export function slugifyLandingSegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getSportBySlug(slug: string) {
  return SPORTS.find((sport) => slugifyLandingSegment(sport.id) === slug)
}

export function getSportSlug(sportId: string) {
  return slugifyLandingSegment(sportId)
}
