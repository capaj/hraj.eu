import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { getTableColumns, getTableName, SQL } from 'drizzle-orm'
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core'
import {
  eventT,
  fioConnectionT,
  fioReceiptT,
  participantT,
  paymentRequestT,
  user
} from '../drizzle/schema.ts'

// Exercise the production SQLite Drizzle queries in an ephemeral PGlite
// database. Only placeholder/default syntax is translated; no service or file
// database is opened, and transactions/constraints are real.
export async function createPaymentTestDatabase(t) {
  const pg = await PGlite.create()
  t.after(() => pg.close())
  await pg.exec(
    'CREATE FUNCTION unixepoch() RETURNS integer LANGUAGE SQL AS $$ SELECT extract(epoch from now())::integer $$;'
  )
  const dialect = new SQLiteSyncDialect()
  for (const table of [
    user,
    eventT,
    participantT,
    fioConnectionT,
    paymentRequestT,
    fioReceiptT
  ]) {
    const columns = Object.values(getTableColumns(table)).map((column) => {
      let type = column.getSQLType()
      if (type === 'real') type = 'double precision'
      if (column.primary && type === 'integer') type = 'serial'
      let def = column.default
      if (def instanceof SQL) def = dialect.sqlToQuery(def).sql
      else if (typeof def === 'boolean') def = def ? 1 : 0
      else if (typeof def === 'string') def = `'${def.replaceAll("'", "''")}'`
      const constraint = column.primary ? ' PRIMARY KEY' : ''
      const notNull = column.notNull ? ' NOT NULL' : ''
      return `"${column.name}" ${type}${constraint}${notNull}${def === undefined ? '' : ` DEFAULT ${def}`}`
    })
    await pg.exec(
      `CREATE TABLE "${getTableName(table)}" (${columns.join(', ')})`
    )
  }
  await pg.exec(`CREATE UNIQUE INDEX event_user_idx ON participant(event_id, user_id);
    CREATE UNIQUE INDEX payment_request_active_slot ON payment_request(participant_id, slot) WHERE cancelled_at IS NULL;
    CREATE UNIQUE INDEX fio_receipt_transaction_idx ON fio_receipt(iban, transaction_id);`)
  function wrap(connection) {
    const database = drizzle(async (sql, params, method) => {
      let index = 0
      const query = sql
        .replaceAll('?', () => `$${++index}`)
        .replace(/values \(null,/g, 'values (default,')
        .replace(/\), \(null,/g, '), (default,')
      const result = await connection.query(query, params, { rowMode: 'array' })
      return { rows: method === 'get' ? result.rows[0] : result.rows }
    })
    database.transaction = (callback) =>
      connection.transaction((tx) => callback(wrap(tx)))
    return database
  }
  const database = wrap(pg)
  await database.insert(user).values(
    ['organizer', 'anna', 'petr', 'jan'].map((id) => ({
      id,
      name: id,
      email: `${id}@example.test`,
      emailVerified: true
    }))
  )
  await database.insert(fioConnectionT).values({
    userId: 'organizer',
    iban: 'CZ0520100000002400222222',
    accountNumber: '2400222222/2010',
    currency: 'CZK',
    encryptedToken: 'test-only'
  })
  await database.insert(eventT).values({
    id: 'event',
    title: 'Test football',
    sport: 'football',
    date: '2099-10-29',
    startTime: '18:30',
    duration: 90,
    minParticipants: 1,
    idealParticipants: 2,
    maxParticipants: 2,
    cancellationDeadlineMinutes: 120,
    organizerId: 'organizer',
    price: 300,
    currency: 'CZK',
    paymentMode: 'fio',
    requirePayment: true,
    pricePerPersonCents: 15000,
    fioConnectionId: 'organizer'
  })
  return { database, pg }
}
