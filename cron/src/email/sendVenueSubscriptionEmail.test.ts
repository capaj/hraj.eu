import { describe, expect, it, vi } from 'vitest'
import { sendVenueSubscriptionEmail } from './sendVenueSubscriptionEmail'

describe('sendVenueSubscriptionEmail', () => {
  it('links to the event and escapes venue and event names in the email body', async () => {
    const send = vi.fn(
      async (_message: { html: string }) => ({
        data: { id: 'email-1' },
        error: null
      })
    )
    const resend = { emails: { send } }

    await sendVenueSubscriptionEmail({
      resend: resend as never,
      from: 'events@example.com',
      to: 'player@example.com',
      venueName: 'Arena <North>',
      events: [
        {
          id: 'event/one',
          title: 'Five & five',
          date: '2026-09-12',
          startTime: '18:30'
        }
      ],
      baseUrl: 'https://example.com'
    })

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'events@example.com',
        to: 'player@example.com',
        subject: 'New upcoming events at Arena <North>',
        html: expect.stringContaining(
          '<a href="https://example.com/events/event%2Fone">Five &amp; five</a>'
        )
      })
    )
    const sentEmail = send.mock.calls[0]?.[0]
    expect(sentEmail?.html).toContain('Arena &lt;North&gt;')
    expect(sentEmail?.html).toContain(
      '<a href="https://example.com/venues">https://example.com/venues</a>'
    )
  })

  it('surfaces provider errors so the notification cursor is not advanced', async () => {
    const resend = {
      emails: {
        send: vi.fn(async () => ({
          data: null,
          error: { message: 'provider unavailable' }
        }))
      }
    }

    await expect(
      sendVenueSubscriptionEmail({
        resend: resend as never,
        from: 'events@example.com',
        to: 'player@example.com',
        venueName: 'Arena',
        events: [],
        baseUrl: 'https://example.com'
      })
    ).rejects.toThrow('provider unavailable')
  })
})
