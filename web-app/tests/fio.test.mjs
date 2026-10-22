import { setManualPaymentHandler } from '../src/server-functions/setManualPaymentHandler.ts'
import test from 'node:test'
import assert from 'node:assert/strict'
import { eq } from 'drizzle-orm'
import {
  eventT,
  fioConnectionT,
  fioReceiptT,
  participantT,
  paymentRequestT
} from '../drizzle/schema.ts'
import {
  fetchFioStatement,
  parseFioStatement,
  pragueDate
} from '../src/lib/fio/api.ts'
import { encryptFioToken, decryptFioToken } from '../src/lib/fio/crypto.ts'
import {
  paymentVariableSymbol,
  fixedPriceCents
} from '../src/lib/fio/paymentPolicy.ts'
import {
  reconcileFioStatement,
  resolveEventPayment,
  promotePaymentWaitlist
} from '../src/lib/fio/payments.ts'
import { syncFioConnection } from '../src/lib/fio/sync.ts'
import { generateQrPaymentString } from '../src/lib/qrCodeGenerator.ts'
import { joinEventHandler } from '../src/server-functions/joinEventHandler.ts'
import { leaveEventHandler } from '../src/server-functions/leaveEventHandler.ts'
import { createPaymentTestDatabase } from './fioPglite.mjs'

const iban = 'CZ0520100000002400222222'
const key = 'ab'.repeat(32)
const token = 'T'.repeat(64)
const statement = (credits = []) => ({
  iban,
  accountNumber: '2400222222/2010',
  currency: 'CZK',
  credits
})
const rawStatement = (transactions = []) => ({
  accountStatement: {
    info: { iban, accountId: '2400222222', bankId: '2010', currency: 'CZK' },
    transactionList: { transaction: transactions }
  }
})
const rawCredit = (amount = 150, symbol = '1000000001', id = 123) => ({
  column22: { value: id },
  column0: { value: '2026-10-22+02:00' },
  column1: { value: amount },
  column5: { value: symbol },
  column14: { value: 'CZK' }
})
const credit = (id, requestId, amountCents = 15000, overrides = {}) => ({
  id,
  variableSymbol: paymentVariableSymbol(requestId),
  amountCents,
  currency: 'CZK',
  bookedOn: pragueDate(new Date()),
  ...overrides
})
const join = (database, userId, plusAttendees) =>
  joinEventHandler(database, { eventId: 'event', userId, plusAttendees })
const participants = (database) => database.select().from(participantT)
const requests = (database) => database.select().from(paymentRequestT)
const reconcile = (database, credits) =>
  database.transaction((tx) =>
    reconcileFioStatement(tx, 'organizer', statement(credits))
  )

test('Fio parser accepts only incoming referenced credits and validates the account', () => {
  const parsed = parseFioStatement(
    rawStatement([
      rawCredit(),
      rawCredit(-150),
      rawCredit(10, null),
      rawCredit(0.01, '0000000001', 124)
    ])
  )
  assert.equal(parsed.credits.length, 2)
  assert.equal(parsed.credits[0].amountCents, 15000)
  assert.equal(parsed.credits[1].variableSymbol, '1')
  assert.equal(parsed.credits[1].amountCents, 1)
  const invalid = rawStatement()
  invalid.accountStatement.info.currency = 'EUR'
  assert.throws(() => parseFioStatement(invalid), /unsupported_account/)
  assert.deepEqual(
    parseFioStatement({
      accountStatement: {
        ...rawStatement().accountStatement,
        transactionList: null
      }
    }).credits,
    []
  )
})

test('API uses repeatable GET periods and never exposes tokens in failures', async () => {
  await fetchFioStatement(
    token,
    '2026-10-20',
    '2026-10-22',
    async (url, options) => {
      assert.match(
        url,
        /\/periods\/.*\/2026-10-20\/2026-10-22\/transactions.json$/
      )
      assert.equal(options.method, 'GET')
      assert.equal(options.redirect, 'error')
      return Response.json(rawStatement())
    }
  )
  await assert.rejects(
    fetchFioStatement(token, '2026-10-20', '2026-10-22', async () => {
      throw new Error(`Request to ${token} failed`)
    }),
    (error) =>
      error.message === 'bank_unavailable' && !error.stack.includes(token)
  )
  await assert.rejects(
    fetchFioStatement(
      token,
      '2026-10-20',
      '2026-10-22',
      async () => new Response('', { status: 409 })
    ),
    /rate_limited/
  )
})

test('token encryption authenticates ciphertext and account ownership', async () => {
  const encrypted = await encryptFioToken(token, key, 'owner')
  assert.equal(await decryptFioToken(encrypted, key, 'owner'), token)
  assert.notEqual(await encryptFioToken(token, key, 'owner'), encrypted)
  await assert.rejects(decryptFioToken(encrypted, key, 'another-owner'))
  await assert.rejects(decryptFioToken(encrypted, 'cd'.repeat(32), 'owner'))
  await assert.rejects(encryptFioToken(token, 'weak-key', 'owner'))
})

test('QR references are numeric and distinct with fixed cent amounts', () => {
  assert.equal(fixedPriceCents(1800, 12), 15000)
  assert.equal(fixedPriceCents(100, 3), 3333)
  assert.throws(() => fixedPriceCents(0, 3))
  assert.throws(() => paymentVariableSymbol(9_000_000_000))
  const qr = generateQrPaymentString({
    accountNumber: iban,
    amount: 150,
    variableSymbol: paymentVariableSymbol(1),
    message: 'Foot*X-VS:9'
  })
  assert.match(qr, /AM:150.00\*CC:CZK\*X-VS:1000000001/)
  assert.equal(qr.split('*X-VS:').length, 2)
  assert.equal(
    generateQrPaymentString({ accountNumber: iban, variableSymbol: '1*AM:1' }),
    null
  )
})

test('advance bookings reserve capacity atomically without confirming unpaid players', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  const statuses = await Promise.all(
    ['anna', 'petr', 'jan'].map((id) => join(database, id))
  )
  assert.equal(
    statuses.filter((status) => status === 'pending_payment').length,
    2
  )
  assert.equal(statuses.filter((status) => status === 'waitlisted').length, 1)
  assert.equal((await requests(database)).length, 2)
  assert.equal(
    (await participants(database)).filter((p) => p.status === 'confirmed')
      .length,
    0
  )
})

test('partial, duplicate, wrong currency and old payments cannot confirm attendance', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna')
  const [request] = await requests(database)
  await reconcile(database, [
    credit('part', request.id, 5000),
    credit('part', request.id, 5000),
    credit('eur', request.id, 15000, { currency: 'EUR' }),
    credit('old', request.id, 15000, { bookedOn: '2000-01-01' }),
    credit('unknown', 123456)
  ])
  assert.equal((await participants(database))[0].status, 'pending_payment')
  assert.equal((await database.select().from(fioReceiptT)).length, 1)
  await reconcile(database, [credit('rest', request.id, 10000)])
  assert.equal((await participants(database))[0].status, 'confirmed')
  const paidAt = (await requests(database))[0].paidAt
  await reconcile(database, [credit('rest', request.id, 10000)])
  assert.deepEqual((await requests(database))[0].paidAt, paidAt)
  assert.equal((await database.select().from(fioReceiptT)).length, 2)
})

test('every guest gets a unique reference and the whole booking must be paid', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna', ['Guest'])
  const invoices = await requests(database)
  assert.equal(invoices.length, 2)
  assert.notEqual(
    paymentVariableSymbol(invoices[0].id),
    paymentVariableSymbol(invoices[1].id)
  )
  await reconcile(database, [credit('player', invoices[0].id)])
  assert.equal((await participants(database))[0].status, 'pending_payment')
  await reconcile(database, [credit('guest', invoices[1].id)])
  assert.equal((await participants(database))[0].status, 'confirmed')
  await assert.rejects(
    join(database, 'anna', ['Different guest']),
    /guests must join separately/
  )
})

test('leaving cancels QR requests, promotes waitlist to pending, and rejects late confirmation', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna', ['Guest'])
  await join(database, 'petr')
  const [oldRequest] = await requests(database)
  await leaveEventHandler(database, { eventId: 'event', userId: 'anna' })
  let rows = await participants(database)
  assert.equal(rows.find((p) => p.userId === 'petr').status, 'pending_payment')
  assert.equal(
    (await requests(database)).filter((request) => !request.cancelledAt).length,
    1
  )
  await reconcile(database, [credit('late', oldRequest.id)])
  rows = await participants(database)
  assert.equal(rows.find((p) => p.userId === 'anna').status, 'cancelled')
  await join(database, 'anna')
  assert.equal(
    (await participants(database)).find((p) => p.userId === 'anna').status,
    'pending_payment'
  )
  assert.ok(
    (await requests(database)).find(
      (request) => !request.cancelledAt && request.playerName === 'anna'
    ).id > oldRequest.id
  )
})

test('cancelled-event payments are recorded for refunds without confirming attendance', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna')
  const [request] = await requests(database)
  await database
    .update(eventT)
    .set({ status: 'cancelled' })
    .where(eq(eventT.id, 'event'))
  await reconcile(database, [credit('cancelled', request.id, 16000)])
  assert.equal((await participants(database))[0].status, 'pending_payment')
  assert.ok((await requests(database))[0].paidAt)
  assert.equal(
    (await database.select().from(fioReceiptT))[0].amountCents,
    16000
  )
})

test('a failed commit rolls back payments so retries remain safe', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna')
  const [request] = await requests(database)
  await assert.rejects(
    database.transaction(async (tx) => {
      await reconcileFioStatement(
        tx,
        'organizer',
        statement([credit('retry', request.id)])
      )
      throw new Error('simulated failure')
    })
  )
  assert.equal((await database.select().from(fioReceiptT)).length, 0)
  assert.equal((await participants(database))[0].status, 'pending_payment')
  await reconcile(database, [credit('retry', request.id)])
  assert.equal((await participants(database))[0].status, 'confirmed')
})

test('sync lease prevents concurrent requests and failures preserve the successful cursor', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  const now = new Date(),
    lastSyncedAt = new Date(now.getTime() - 86400000)
  await database
    .update(fioConnectionT)
    .set({
      encryptedToken: await encryptFioToken(token, key, 'organizer'),
      nextSyncAt: new Date(now.getTime() - 1000),
      lastSyncedAt
    })
    .where(eq(fioConnectionT.userId, 'organizer'))
  let calls = 0
  const unavailable = async () => {
    calls++
    return new Response('', { status: 403 })
  }
  await Promise.all([
    syncFioConnection(database, 'organizer', key, now, unavailable),
    syncFioConnection(database, 'organizer', key, now, unavailable)
  ])
  assert.equal(calls, 1)
  const [connection] = await database.select().from(fioConnectionT)
  assert.equal(connection.syncError, 'token_unavailable')
  assert.equal(
    connection.lastSyncedAt.getTime(),
    Math.floor(lastSyncedAt.getTime() / 1000) * 1000
  )
  assert.ok(!JSON.stringify(connection.syncError).includes(token))
})

test('manual events retain immediate attendance; Fio setup checks account ownership and currency', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await database
    .update(eventT)
    .set({ paymentMode: 'manual', requirePayment: false })
    .where(eq(eventT.id, 'event'))
  assert.equal(await join(database, 'anna'), 'confirmed')
  assert.equal((await requests(database)).length, 0)
  await assert.rejects(
    resolveEventPayment(database, 'anna', {
      paymentMode: 'fio',
      price: 300,
      currency: 'CZK',
      maxParticipants: 2
    }),
    /Connect your Fio account/
  )
  await assert.rejects(
    resolveEventPayment(database, 'organizer', {
      paymentMode: 'fio',
      price: 300,
      currency: 'EUR',
      maxParticipants: 2
    }),
    /CZK/
  )
})

test('players cannot self-confirm advance payment or overwrite bank-verified status', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna')
  await assert.rejects(
    setManualPaymentHandler(database, {
      eventId: 'event',
      actorId: 'anna',
      paid: true
    }),
    /only be confirmed by the bank/
  )
  await assert.rejects(
    setManualPaymentHandler(database, {
      eventId: 'event',
      actorId: 'organizer',
      targetUserId: 'anna',
      paid: true
    }),
    /only be confirmed by the bank/
  )
  await database
    .update(eventT)
    .set({ paymentMode: 'manual' })
    .where(eq(eventT.id, 'event'))
  await assert.rejects(
    setManualPaymentHandler(database, {
      eventId: 'event',
      actorId: 'anna',
      paid: true
    }),
    /Only the organizer/
  )
  await assert.rejects(
    setManualPaymentHandler(database, {
      eventId: 'event',
      actorId: 'petr',
      targetUserId: 'anna',
      paid: true
    }),
    /Only the organizer/
  )
  await setManualPaymentHandler(database, {
    eventId: 'event',
    actorId: 'organizer',
    targetUserId: 'anna',
    paid: true
  })
  assert.equal((await participants(database))[0].status, 'confirmed')
  await setManualPaymentHandler(database, {
    eventId: 'event',
    actorId: 'organizer',
    targetUserId: 'anna',
    paid: false
  })
  assert.equal((await participants(database))[0].status, 'pending_payment')
})

test('capacity edits preserve issued amounts and payment terms cannot change after booking', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  const [event] = await database.select().from(eventT)
  const { prepareEventPaymentUpdate, promotePaymentWaitlist } = await import(
    '../src/lib/fio/payments.ts'
  )
  assert.equal(
    (await prepareEventPaymentUpdate(database, event, { idealParticipants: 3 }))
      .pricePerPersonCents,
    10000
  )
  await join(database, 'anna')
  await join(database, 'petr')
  await join(database, 'jan')
  assert.deepEqual(
    await prepareEventPaymentUpdate(database, event, { maxParticipants: 3 }),
    {}
  )
  await assert.rejects(
    prepareEventPaymentUpdate(database, event, { requirePayment: false }),
    /locked/
  )
  await assert.rejects(
    prepareEventPaymentUpdate(database, event, { paymentMode: 'manual' }),
    /locked/
  )
  await assert.rejects(
    prepareEventPaymentUpdate(database, event, { price: 600 }),
    /locked/
  )
  await database.transaction((tx) =>
    promotePaymentWaitlist(tx, { ...event, maxParticipants: 3 })
  )
  assert.equal(
    (await participants(database)).find((p) => p.userId === 'jan').status,
    'pending_payment'
  )
  assert.equal((await requests(database)).length, 3)
  assert.ok(
    (await requests(database)).every((request) => request.amountCents === 15000)
  )
})

test('successful Fio sync settles payment and commits the cursor together', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna')
  const [request] = await requests(database)
  const now = new Date()
  await database
    .update(fioConnectionT)
    .set({
      encryptedToken: await encryptFioToken(token, key, 'organizer'),
      nextSyncAt: new Date(now.getTime() - 1000)
    })
    .where(eq(fioConnectionT.userId, 'organizer'))
  const transaction = rawCredit(150, paymentVariableSymbol(request.id), 123)
  transaction.column0.value = pragueDate(now) + '+02:00'
  await syncFioConnection(database, 'organizer', key, now, async () =>
    Response.json(rawStatement([transaction]))
  )
  assert.equal((await participants(database))[0].status, 'confirmed')
  const [connection] = await database.select().from(fioConnectionT)
  assert.ok(connection.lastSyncedAt)
  assert.equal(connection.syncError, null)
})

test('a registered guest cannot create another booking and payment request', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna', [{ name: 'Petr', userId: 'petr' }])
  await assert.rejects(join(database, 'petr'), /already registered/)
  assert.equal((await participants(database)).length, 1)
  assert.equal((await requests(database)).length, 2)
})

test('cancelled events never promote waiting players or issue new payment requests', async (t) => {
  const { database } = await createPaymentTestDatabase(t)
  await join(database, 'anna')
  await join(database, 'petr')
  await join(database, 'jan')
  await database
    .update(eventT)
    .set({ status: 'cancelled' })
    .where(eq(eventT.id, 'event'))
  await leaveEventHandler(database, { eventId: 'event', userId: 'anna' })
  const [event] = await database.select().from(eventT)
  assert.equal(
    await database.transaction((tx) =>
      promotePaymentWaitlist(tx, { ...event, maxParticipants: 4 })
    ),
    0
  )
  assert.equal(
    (await participants(database)).find((p) => p.userId === 'jan').status,
    'waitlisted'
  )
  assert.equal((await requests(database)).length, 2)
})
