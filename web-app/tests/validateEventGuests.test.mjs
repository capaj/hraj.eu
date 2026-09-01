import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { validateEventGuests } from '../src/server-functions/validateEventGuests.ts'

test('keeps free-form guests and canonicalizes referenced player names', async (t) => {
  const client = createClient({ url: 'file::memory:' })
  t.after(() => client.close())
  await client.execute(
    'CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL)'
  )
  await client.execute({
    sql: 'INSERT INTO user (id, name) VALUES (?, ?)',
    args: ['linked-user', 'Canonical Name']
  })

  const guests = await validateEventGuests(
    drizzle(client),
    [
      { name: 'Any free-form name' },
      { name: 'Stale Name', userId: 'linked-user' }
    ],
    [],
    'owner'
  )

  assert.deepEqual(guests, [
    { name: 'Any free-form name' },
    { name: 'Canonical Name', userId: 'linked-user' }
  ])
})

test('rejects a referenced player who is already attending', async () => {
  await assert.rejects(
    validateEventGuests(
      {},
      [{ name: 'Player', userId: 'active-player' }],
      [
        {
          userId: 'active-player',
          status: 'confirmed',
          plusAttendees: []
        }
      ],
      'owner'
    ),
    /already in this event/
  )
})
