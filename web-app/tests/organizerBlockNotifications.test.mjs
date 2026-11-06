import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import { createPaymentTestDatabase } from './fioPglite.mjs'
import { cityEventSubscriptionT, eventCommentNotificationDeliveryT, eventCommentT, eventT, organizerBlockT, participantT, venueEventSubscriptionT, venueT } from '../drizzle/schema.ts'
import scheduled from '../../cron/src/scheduled.ts'
import commentDigests from '../../cron/src/commentDigests.ts'
const { runScheduledJob } = scheduled
const { sendPendingCommentDigests } = commentDigests

test('venue and city subscriptions exclude the blocking organizer, preserve other organizers, and resume after unblocking', async (t) => {
  const { database } = await createPaymentTestDatabase(t, [venueT, cityEventSubscriptionT, venueEventSubscriptionT, eventCommentT, eventCommentNotificationDeliveryT])
  await database.insert(venueT).values({ id: 'venue', name: 'Test Arena', address: 'Main Street', city: 'Prague', country: 'CZ', sports: ['football'] })
  await database.update(eventT).set({ venueId: 'venue', status: 'confirmed', title: 'Blocked organizer match', isPublic: true }).where(eq(eventT.id, 'event'))
  await database.insert(organizerBlockT).values({ organizerId: 'organizer', userId: 'anna' })
  await database.insert(venueEventSubscriptionT).values({ userId: 'anna', venueId: 'venue' })
  await database.insert(cityEventSubscriptionT).values({ userId: 'anna', cityName: 'Prague', citySlug: 'prague' })
  const venueEmails = []
  const cityEmails = []
  const run = () => runScheduledJob({
    event: { cron: '* * * * *' },
    env: { RESEND_API_KEY: 'fixture', SENDER_EMAIL: 'sender@example.test', APP_BASE_URL: 'https://example.test' },
    database,
    resend: { emails: { send: async (message) => { cityEmails.push(message); return { data: { id: 'fixture' }, error: null } } } },
    sendVenueSubscription: async (message) => { venueEmails.push(message) },
    sendConfirmation: async () => assert.fail('unexpected confirmation'),
    sendCancellation: async () => assert.fail('unexpected cancellation')
  })
  await run()
  assert.deepEqual(venueEmails, [])
  assert.deepEqual(cityEmails, [])
  const [source] = await database.select().from(eventT)
  await database.insert(eventT).values({ ...source, id: 'other-event', organizerId: 'petr', title: 'Allowed organizer match' })
  await run()
  assert.equal(venueEmails.length, 1)
  assert.deepEqual(venueEmails[0].events.map((event) => event.id), ['other-event'])
  assert.equal(venueEmails[0].to, 'anna@example.test')
  assert.equal(cityEmails.length, 1)
  assert.match(cityEmails[0].html, /Allowed organizer match/)
  assert.doesNotMatch(cityEmails[0].html, /Blocked organizer match/)
  await database.delete(organizerBlockT)
  await database.insert(eventT).values({ ...source, id: 'new-event', title: 'After unblock', createdAt: new Date(Date.now() + 10000) })
  await run()
  assert.equal(venueEmails.length, 2)
  assert.ok(venueEmails[1].events.some((event) => event.id === 'new-event'))
})

test('pending comment notifications exclude blocked players even when historical attendance is retained', async (t) => {
  const { database } = await createPaymentTestDatabase(t, [eventCommentT, eventCommentNotificationDeliveryT])
  await database.update(eventT).set({ date: '2020-01-01', status: 'completed' }).where(eq(eventT.id, 'event'))
  await database.insert(organizerBlockT).values({ organizerId: 'organizer', userId: 'anna' })
  await database.insert(participantT).values(['anna', 'jan'].map((userId, index) => ({
    eventId: 'event', userId, status: 'confirmed', confirmedParticipantOrdinal: index + 1
  })))
  await database.insert(eventCommentT).values({ id: 'comment', eventId: 'event', userId: 'organizer', content: 'Match recap' })
  const recipients = []
  await sendPendingCommentDigests({
    database, resend: {}, senderEmail: 'sender@example.test', baseUrl: 'https://example.test',
    sendDigest: async (message) => { recipients.push(message.to) }
  })
  assert.deepEqual(recipients, ['jan@example.test'])
  const [comment] = await database.select().from(eventCommentT)
  assert.ok(comment.notifiedAt)
})
