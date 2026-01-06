import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse, loadGoogleFont } from 'workers-og'
import { getEventById } from '~/server-functions/getEventById'
import { getVenues } from '~/server-functions/getVenues'
import { getUsersByIds } from '~/server-functions/getUsersByIds'
import { SPORTS } from '~/lib/constants'
import { env } from 'cloudflare:workers'

const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400'

let inter400: Promise<ArrayBuffer> | undefined
let inter700: Promise<ArrayBuffer> | undefined

function getInter400() {
  inter400 ??= loadGoogleFont({ family: 'Inter', weight: 400 })
  return inter400
}

function getInter700() {
  inter700 ??= loadGoogleFont({ family: 'Inter', weight: 700 })
  return inter700
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(arrayBuffer).toString('base64')
  }

  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function urlToDataUri(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${url}`)
  }
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await res.arrayBuffer()
  return `data:${contentType};base64,${arrayBufferToBase64(arrayBuffer)}`
}

export const Route = createFileRoute('/api/og/event/$eventId')({
  server: {
    handlers: {
      HEAD: () => {
        return new Response(null, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': CACHE_CONTROL
          }
        })
      },
      GET: async ({ request, params }) => {
        try {
          const bucket = env.hraj_eu_uploads

          const origin = new URL(request.url).origin
          const event = await getEventById({ data: params.eventId })
          const venues = await getVenues()
          const venue = venues.find((v: any) => v.id === event.venueId)

          const participantsCount = event.participants?.length ?? 0
          const maxParticipants = event.maxParticipants ?? 0
          const cachePrefix = `og-images/${params.eventId}-`
          const cacheKey = `${cachePrefix}${event.updatedAt.getTime()}-${participantsCount}.png`

          if (bucket) {
            const existing = await bucket.get(cacheKey)
            if (existing) {
              return new Response(existing.body, {
                headers: {
                  'Content-Type': 'image/png',
                  'Cache-Control': CACHE_CONTROL
                }
              })
            }
          }

          // Fetch participants
          const participantIds = event.participants.slice(0, 5)
          const topParticipants = participantIds.length > 0
            ? await getUsersByIds({ data: participantIds })
            : []

          const sportObj = SPORTS.find((s) => s.id === event.sport)
          const sportName = sportObj?.name ?? event.sport
          const sportIcon = sportObj?.icon ?? ''

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

          const duration = event.duration ? `${event.duration} min` : ''

          const where = venue?.name
            ? `${venue.name}${venue.city ? `, ${venue.city}` : ''}`
            : 'TBA'

          const photoUrl = venue?.photos?.[0]
            ? new URL(venue.photos[0], origin).toString()
            : null

          const photoDataUri = photoUrl
            ? await urlToDataUri(photoUrl).catch(() => null)
            : null

          // Fetch participant avatars
          const avatarPromises = topParticipants.map(async (p: any) => {
            if (p.image) {
              // Ensure absolute URL if it's relative
              const imgUrl = p.image.startsWith('http')
                ? p.image
                : new URL(p.image, origin).toString()
              return await urlToDataUri(imgUrl).catch(() => null)
            }
            return null
          })
          const avatarDataUris = await Promise.all(avatarPromises)

          const fontData400 = await getInter400()
          const fontData700 = await getInter700()

          const title = (event.title || 'Event').trim()

          const imageResponse = new ImageResponse(
            <div
              style={{
                width: '1200px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Inter',
                position: 'relative',
                backgroundColor: '#111827',
                color: 'white',
              }}
            >
              {/* Background Image */}
              {photoDataUri ? (
                <img
                  src={photoDataUri}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '1200px',
                    height: '630px',
                    objectFit: 'cover',
                  }}
                />
              ) : null}

              {/* Dark Overlay Gradient */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.95) 100%)',
                }}
              />

              {/* Content Container */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%',
                  height: '100%',
                  padding: '60px',
                }}
              >
                {/* Top Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.9 }}>hraj.eu</div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 20px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '50px',
                      fontSize: 24,
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {/* TODO: Use PNG icons for sports instead of emojis as they render poorly in OG images */}
                    {/* <div style={{ fontSize: 24 }}>{sportIcon}</div> */}
                    <div>{sportName}</div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Title and Location */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                      {title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, opacity: 0.9 }}>
                      <div>{where}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>
                      <div>{when}</div>
                      {duration && (
                        <>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', opacity: 0.6 }} />
                          <div>{duration}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Players and Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>

                    {/* Avatars + Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Avatar Stack */}
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {topParticipants.map((p: any, i: number) => (
                          <div
                            key={p.id}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              border: '3px solid #111827',
                              marginLeft: i === 0 ? 0 : -18,
                              overflow: 'hidden',
                              background: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              fontWeight: 600,
                              color: '#9CA3AF'
                            }}
                          >
                            {avatarDataUris[i] ? (
                              <img src={avatarDataUris[i]!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div>{(p.name || '?').charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Count Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '16px 32px',
                          background: 'rgba(59, 130, 246, 0.9)',
                          borderRadius: '50px',
                          fontWeight: 700,
                          fontSize: 32,
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                        }}
                      >
                        {`${participantsCount}/${maxParticipants} Players`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            {
              width: 1200,
              height: 630,
              fonts: [
                {
                  name: 'Inter',
                  data: fontData400,
                  weight: 400,
                  style: 'normal'
                },
                {
                  name: 'Inter',
                  data: fontData700,
                  weight: 700,
                  style: 'normal'
                }
              ]
            }
          )

          if (bucket) {
            const buffer = await imageResponse.arrayBuffer()
            const existingCacheObjects = await bucket
              .list({ prefix: cachePrefix })
              .then((listResult) => listResult.objects.map((obj) => obj.key))
              .catch(() => [])

            await bucket.put(cacheKey, buffer, {
              httpMetadata: {
                contentType: 'image/png',
                cacheControl: CACHE_CONTROL
              }
            })

            await Promise.all(
              existingCacheObjects
                .filter((key) => key !== cacheKey)
                .map((key) => bucket.delete(key))
            )

            return new Response(buffer, {
              headers: {
                ...Object.fromEntries(imageResponse.headers),
                'Content-Type': 'image/png',
                'Cache-Control': CACHE_CONTROL
              }
            })
          }

          imageResponse.headers.set('Cache-Control', CACHE_CONTROL)
          return imageResponse
        } catch (error: any) {
          console.error('Error generating OG image:', error)
          return new Response(
            `Error generating image: ${error.message}\n${error.stack}`,
            {
              status: 500,
              headers: {
                'Content-Type': 'text/plain'
              }
            }
          )
        }
      }
    }
  }
})
