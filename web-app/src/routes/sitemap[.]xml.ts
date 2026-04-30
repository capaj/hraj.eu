import { createFileRoute } from '@tanstack/react-router'
import { and, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '../../drizzle/db'
import { eventT } from '../../drizzle/schema'

const CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600'

type SitemapUrl = {
  loc: string
  lastmod?: Date
  changefreq?: 'daily' | 'weekly' | 'monthly'
  priority?: number
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function buildUrl(origin: string, pathname: string) {
  return new URL(pathname, origin).toString()
}

function renderSitemap(urls: SitemapUrl[]) {
  const entries = urls
    .map((url) => {
      const optionalFields = [
        url.lastmod ? `    <lastmod>${formatDate(url.lastmod)}</lastmod>` : null,
        url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : null,
        url.priority ? `    <priority>${url.priority.toFixed(1)}</priority>` : null
      ].filter(Boolean)

      return [
        '  <url>',
        `    <loc>${escapeXml(url.loc)}</loc>`,
        ...optionalFields,
        '  </url>'
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>'
  ].join('\n')
}

async function getPublicUpcomingEventUrls(origin: string): Promise<SitemapUrl[]> {
  const eventDateTimeSql = sql`datetime(${eventT.date} || ' ' || ${eventT.startTime})`

  const events = await db
    .select({
      id: eventT.id,
      updatedAt: eventT.updatedAt
    })
    .from(eventT)
    .where(
      and(
        eq(eventT.isPublic, true),
        inArray(eventT.status, ['open', 'confirmed']),
        sql`${eventDateTimeSql} >= datetime('now')`,
        or(
          isNull(eventT.coreGroupExclusiveUntil),
          lte(eventT.coreGroupExclusiveUntil, new Date())
        )
      )
    )
    .orderBy(eventDateTimeSql)
    .limit(1000)

  return events.map((event) => ({
    loc: buildUrl(origin, `/events/${event.id}`),
    lastmod: event.updatedAt,
    changefreq: 'daily',
    priority: 0.8
  }))
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      HEAD: () =>
        new Response(null, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': CACHE_CONTROL
          }
        }),
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin
        const today = new Date()
        const { querySeoLandingPageLinks } = await import(
          '~/server-functions/seoLandingPageQueries'
        )

        const urls: SitemapUrl[] = [
          {
            loc: buildUrl(origin, '/'),
            lastmod: today,
            changefreq: 'daily',
            priority: 1
          },
          {
            loc: buildUrl(origin, '/about'),
            changefreq: 'monthly',
            priority: 0.5
          },
          {
            loc: buildUrl(origin, '/leaderboard'),
            changefreq: 'weekly',
            priority: 0.4
          },
          ...(await querySeoLandingPageLinks()).map((link) => ({
            loc: buildUrl(
              origin,
              link.sportId
                ? `/${link.citySlug}/${link.sportSlug}`
                : `/cities/${link.citySlug}`
            ),
            changefreq: link.eventCount > 0 ? ('daily' as const) : ('weekly' as const),
            priority: link.sportId ? 0.7 : 0.6
          })),
          ...(await getPublicUpcomingEventUrls(origin))
        ]

        return new Response(renderSitemap(urls), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': CACHE_CONTROL
          }
        })
      }
    }
  }
})
