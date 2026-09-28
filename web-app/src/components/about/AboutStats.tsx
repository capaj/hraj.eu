import type { ReactNode } from 'react'
import { Trans } from '@lingui/react/macro'
import './AboutStats.css'

type AboutStatsProps = {
  stats: {
    eventsCreated: number
    activeUsers: number
    countries: number
  }
}

function Illustration({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 180 120"
      width="180"
      height="120"
      className="about-stats__illustration"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="90" cy="60" r="48" fill="currentColor" opacity=".06" stroke="none" />
      {children}
    </svg>
  )
}

function EventsIllustration() {
  return (
    <Illustration>
      <g transform="rotate(-8 82 60)">
        <rect x="45" y="29" width="76" height="65" rx="10" fill="#ffffff" fillOpacity=".08" />
        <path d="M45 48h76M64 22v15m38-15v15" />
        <path d="M60 61h8m12 0h8m12 0h6M60 76h8m12 0h8" opacity=".5" />
      </g>
      <ellipse className="about-stats__ball-shadow" cx="127" cy="106" rx="19" ry="3" fill="#052e36" opacity=".25" stroke="none" />
      <g className="about-stats__ball">
        <circle cx="127" cy="82" r="21" fill="#fcd68b" stroke="#fcd68b" />
        <g stroke="#17616a" strokeWidth="2">
          <path d="m127 73 9 7-3 10h-12l-3-10z" fill="#17616a" />
          <path d="m127 73-1-12m10 19 11-3m-15 13 7 9m-18-9-8 8m5-18-10-5" />
        </g>
      </g>
      <path d="m32 47-7-3m12-8-3-7" stroke="#fcd68b" />
      <circle cx="142" cy="35" r="3" fill="#fcd68b" stroke="none" />
    </Illustration>
  )
}

function PlayersIllustration() {
  return (
    <Illustration>
      <path d="M34 105h112" opacity=".2" />
      <g className="about-stats__player about-stats__player--left">
        <circle cx="57" cy="45" r="11" fill="#bae6fd" stroke="#bae6fd" />
        <path d="m48 88-5 16m25-16 5 16M47 65 33 80" strokeWidth="5" />
        <path d="M46 63q11-6 22 0l6 24H40z" fill="#bae6fd" stroke="#bae6fd" />
        <path d="m69 66 13-11 8-22" stroke="#bae6fd" strokeWidth="6" />
      </g>
      <g className="about-stats__player about-stats__player--right">
        <circle cx="123" cy="45" r="11" fill="#fcd68b" stroke="#fcd68b" />
        <path d="m112 88-5 16m25-16 5 16m-4-39 14 15" strokeWidth="5" />
        <path d="M112 63q11-6 22 0l6 24h-34z" fill="#fcd68b" stroke="#fcd68b" />
        <path d="m111 66-13-11-8-22" stroke="#fcd68b" strokeWidth="6" />
      </g>
      <g className="about-stats__cheer" stroke="#fcd68b">
        <path d="M90 20v-7m-10 11-5-5m25 5 5-5" />
      </g>
    </Illustration>
  )
}

function CountriesIllustration() {
  return (
    <Illustration>
      <circle cx="90" cy="61" r="37" fill="#bae6fd" fillOpacity=".1" />
      <ellipse cx="90" cy="61" rx="17" ry="37" opacity=".55" />
      <path d="M54 61h72M60 41q30 13 60 0M60 81q30-13 60 0" opacity=".55" />
      <circle cx="90" cy="61" r="58" strokeDasharray="3 7" opacity=".35" />
      <g className="about-stats__orbit">
        <circle cx="140" cy="32" r="6" fill="#fcd68b" stroke="#fcd68b" />
      </g>
      <g className="about-stats__pin">
        <path d="M102 32a12 12 0 0 1 24 0c0 9-12 18-12 18s-12-9-12-18Z" fill="#fcd68b" stroke="#fcd68b" />
        <circle cx="114" cy="32" r="4" stroke="#17616a" />
      </g>
      <path d="M39 82v8m-4-4h8" stroke="#bae6fd" />
    </Illustration>
  )
}

export function AboutStats({ stats }: AboutStatsProps) {
  return (
    <section className="about-stats bg-black/20 py-10 sm:py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 text-center text-white sm:gap-8 sm:px-6 lg:px-8">
        <div className="about-stats__item">
          <EventsIllustration />
          <dl className="flex w-full flex-col items-center">
            <dt className="about-stats__label"><Trans>Events Created</Trans></dt>
            <dd className="about-stats__number">{stats.eventsCreated.toLocaleString()}</dd>
          </dl>
        </div>
        <div className="about-stats__item">
          <PlayersIllustration />
          <dl className="flex w-full flex-col items-center">
            <dt className="about-stats__label"><Trans>Active Players</Trans></dt>
            <dd className="about-stats__number">{stats.activeUsers.toLocaleString()}</dd>
          </dl>
        </div>
        <div className="about-stats__item">
          <CountriesIllustration />
          <dl className="flex w-full flex-col items-center">
            <dt className="about-stats__label"><Trans>Countries</Trans></dt>
            <dd className="about-stats__number">{stats.countries}</dd>
          </dl>
        </div>
      </div>
    </section>
  )
}
