import type { SVGProps } from 'react'
import type { SPORTS } from '../../lib/constants'
import basketball from './icons/basketball.svg?raw'
import beachVolleyball from './icons/beach-volleyball.svg?raw'
import cricket from './icons/cricket.svg?raw'
import fieldHockey from './icons/field-hockey.svg?raw'
import floorball from './icons/floorball.svg?raw'
import footballTennis from './icons/football-tennis.svg?raw'
import futsal from './icons/futsal.svg?raw'
import handball from './icons/handball.svg?raw'
import iceHockey from './icons/ice-hockey.svg?raw'
import korfball from './icons/korfball.svg?raw'
import netball from './icons/netball.svg?raw'
import rugbyLeague from './icons/rugby-league.svg?raw'
import rugbyUnion from './icons/rugby-union.svg?raw'
import soccer from './icons/soccer.svg?raw'
import volleyball from './icons/volleyball.svg?raw'
import waterPolo from './icons/water-polo.svg?raw'

export type SportIconId = (typeof SPORTS)[number]['id']

const SPORT_ICON_SOURCES = {
  soccer,
  futsal,
  basketball,
  volleyball,
  'beach-volleyball': beachVolleyball,
  'football-tennis': footballTennis,
  handball,
  'rugby-union': rugbyUnion,
  'rugby-league': rugbyLeague,
  'ice-hockey': iceHockey,
  'field-hockey': fieldHockey,
  'water-polo': waterPolo,
  cricket,
  netball,
  korfball,
  floorball
} satisfies Record<SportIconId, string>

const FALLBACK_ICON: SportIconId = 'soccer'

function getSportIconSource(sport: string) {
  return SPORT_ICON_SOURCES[sport as SportIconId] ?? SPORT_ICON_SOURCES[FALLBACK_ICON]
}

function getSvgContents(source: string) {
  const openingTagEnd = source.indexOf('>')
  const closingTagStart = source.lastIndexOf('</svg>')

  if (openingTagEnd === -1 || closingTagStart === -1) {
    return source
  }

  return source.slice(openingTagEnd + 1, closingTagStart)
}

export interface SportIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  sport: string
  size?: number | string
  title?: string
}

/**
 * A shared 24px, rounded-stroke SVG system. The paths live in individual raw
 * SVG files so they can also be consumed outside React.
 */
export function SportIcon({
  sport,
  size = 24,
  title,
  ...props
}: SportIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <g dangerouslySetInnerHTML={{ __html: getSvgContents(getSportIconSource(sport)) }} />
    </svg>
  )
}

/**
 * Use the same raw SVG asset in Leaflet's string-based marker HTML.
 */
export function sportIconSvg(
  sport: string,
  { size = 24, color = 'currentColor' }: { size?: number; color?: string } = {}
) {
  return getSportIconSource(sport).replace(
    '<svg',
    '<svg width="' +
      size +
      '" height="' +
      size +
      '" color="' +
      color +
      '" aria-hidden="true"'
  )
}
