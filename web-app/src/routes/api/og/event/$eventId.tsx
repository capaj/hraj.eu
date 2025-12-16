import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse, loadGoogleFont } from 'workers-og'
import { getEventById } from '~/server-functions/getEventById'
import { getVenues } from '~/server-functions/getVenues'
import { SPORTS } from '~/lib/constants'

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
          const origin = new URL(request.url).origin
          const event = await getEventById({ data: params.eventId })
          const venues = await getVenues()
          const venue = venues.find((v: any) => v.id === event.venueId)

          const sportName =
            SPORTS.find((s) => s.id === event.sport)?.name ?? event.sport

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

          const where = venue?.name
            ? `${venue.name}${venue.city ? `, ${venue.city}` : ''}`
            : 'TBA'

          const photoUrl = venue?.photos?.[0]
            ? new URL(venue.photos[0], origin).toString()
            : null

          const photoDataUri = photoUrl
            ? await urlToDataUri(photoUrl).catch(() => null)
            : null

          const fontData400 = await getInter400()
          const fontData700 = await getInter700()

          const title = (event.title || 'Event').trim()
          const participants = event.participants?.length ?? 0
          const maxParticipants = event.maxParticipants ?? 0

          const imageResponse = new ImageResponse(
            <div
              style={{
                width: '1200px',
                height: '630px',
                display: 'flex',
                padding: '56px',
                background:
                  'linear-gradient(135deg, #0b1220 0%, #111827 45%, #0b1220 100%)',
                color: 'white',
                fontFamily: 'Inter',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.28), transparent 40%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.18), transparent 40%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.18), transparent 40%)'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.08,
                  backgroundImage:
                    'linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '48px 48px'
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        fontSize: 22,
                        letterSpacing: 0.5,
                        opacity: 0.9
                      }}
                    >
                      hraj.eu
                    </div>
                    <div style={{ fontSize: 16, opacity: 0.75 }}>
                      {sportName}
                    </div>
                  </div>

                  {photoDataUri ? (
                    <div
                      style={{
                        width: 148,
                        height: 148,
                        borderRadius: 24,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.18)',
                        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex'
                      }}
                    >
                      <img
                        src={photoDataUri}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  <div
                    style={{
                      fontSize: 64,
                      lineHeight: 1.06,
                      fontWeight: 700,
                      letterSpacing: -1
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    <div style={{ fontSize: 26, opacity: 0.9 }}>{where}</div>
                    <div style={{ fontSize: 22, opacity: 0.75 }}>{when}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      fontSize: 18
                    }}
                  >
                    <div style={{ opacity: 0.8 }}>Players</div>
                    <div style={{ fontWeight: 700 }}>
                      {participants}/{maxParticipants}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 999,
                      background: 'rgba(59,130,246,0.18)',
                      border: '1px solid rgba(59,130,246,0.35)',
                      fontSize: 18
                    }}
                  >
                    {new URL(`/events/${event.id}`, origin).toString()}
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
