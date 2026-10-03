import { describe, expect, it, vi } from 'vitest'
import type { Resend } from 'resend'
import type { EventRow } from '../types'
import { sendConfirmationEmail } from './sendConfirmationEmail'
import { sendCancellationEmail } from './sendCancellationEmail'
import { sendCitySubscriptionEmail } from './sendCitySubscriptionEmail'
import { sendCommentDigestEmail } from './sendCommentDigestEmail'

function emailClient() {
  const send = vi.fn(async (_message: { subject: string; html: string; text?: string }) => ({
    data: { id: 'preview' },
    error: null
  }))
  return { send, resend: { emails: { send } } as unknown as Resend }
}

const event: EventRow = {
  id: 'game',
  title: 'Futsal <večer>',
  description: 'Vezmi si sálové boty.',
  sport: 'futsal',
  date: '2026-10-08',
  startTime: '18:30',
  duration: 60,
  minParticipants: 10,
  idealParticipants: 14,
  maxParticipants: 16,
  reservedParticipants: 0,
  price: 1450,
  currency: 'CZK',
  paymentDetails: null,
  gameRules: null,
  venueName: 'Hala',
  venueAddress: 'Janouškova 2',
  confirmedCount: 10
}

const recipient = {
  from: 'events@example.com',
  to: 'player@example.com',
  name: 'Jan',
  event,
  location: 'Janouškova 2',
  eventUrl: 'https://example.com/events/game'
}

describe('scheduled email localization', () => {
  it('sends confirmation in Czech with the event date and unchanged calendar attachment', async () => {
    const { send, resend } = emailClient()
    await sendConfirmationEmail({
      ...recipient,
      resend,
      icalContent: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
      icsFilename: 'game.ics'
    })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Událost potvrzena: Futsal <večer>',
      html: expect.stringContaining('Futsal &lt;večer&gt;'),
      text: expect.stringContaining('Kdy: 8. října 2026 18:30 (60 min)'),
      attachments: [expect.objectContaining({
        filename: 'game.ics',
        content: btoa('BEGIN:VCALENDAR\nEND:VCALENDAR')
      })]
    }))
  })

  it('translates automatic cancellation reasons and preserves organizer-written reasons', async () => {
    const { send, resend } = emailClient()
    await sendCancellationEmail({ ...recipient, resend, reason: 'Minimum participants not reached' })
    expect(send.mock.calls[0]?.[0].text).toContain('Důvod: Nebyl dosažen minimální počet účastníků')

    await sendCancellationEmail({ ...recipient, resend, reason: 'Hala je zavřená.' })
    expect(send.mock.calls[1]?.[0].text).toContain('Důvod: Hala je zavřená.')
  })

  it('supports an explicit English recipient locale', async () => {
    const { send, resend } = emailClient()
    await sendCancellationEmail({
      ...recipient,
      resend,
      locale: 'en',
      reason: 'Minimum participants not reached'
    })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Event cancelled: Futsal <večer>',
      text: expect.stringContaining('Reason: Minimum participants not reached')
    }))
  })

  it('localizes city subscription emails without changing event links', async () => {
    const { send, resend } = emailClient()
    await sendCitySubscriptionEmail({
      resend,
      from: recipient.from,
      to: recipient.to,
      cityName: 'Brno',
      citySlug: 'brno',
      events: [{ ...event, title: 'Futsal' }],
      baseUrl: 'https://example.com'
    })
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Nové nadcházející události – Brno',
      html: expect.stringContaining('<a href="https://example.com/events/game">Futsal</a> – 8. října 2026 18:30')
    }))
  })

  it.each([
    [1, '1 nový komentář', 'přibyl'],
    [3, '3 nové komentáře', 'přibyly'],
    [5, '5 nových komentářů', 'přibylo']
  ])('uses Czech comment plurals for %i comments', async (count, phrase, verb) => {
    const { send, resend } = emailClient()
    await sendCommentDigestEmail({
      resend,
      from: recipient.from,
      to: recipient.to,
      name: recipient.name,
      eventTitle: event.title,
      eventUrl: recipient.eventUrl,
      comments: Array.from({ length: count }, () => ({
        authorName: 'Petra',
        content: 'Přijdu <určitě>.',
        createdAt: new Date('2026-10-03T10:00:00Z')
      })),
      idempotencyKey: 'digest-preview'
    })
    expect(send.mock.calls[0]?.[0].subject).toBe(`${phrase} – ${event.title}`)
    expect(send.mock.calls[0]?.[0].html).toContain(`V diskuzi k události ${verb} ${phrase}.`)
    expect(send.mock.calls[0]?.[0].html).toContain('Přijdu &lt;určitě&gt;.')
    expect(send.mock.calls[0]?.[0].html).toContain('Futsal &lt;večer&gt;')
  })
})
