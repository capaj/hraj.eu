import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

const db = drizzle(client)

async function main() {
  // Update all events to have empty array for qr_code_images
  const result = await db.run(
    sql`UPDATE event SET qr_code_images = '[]' WHERE qr_code_images IS NULL OR qr_code_images = 'null'`
  )
  console.log('Updated rows:', result.rowsAffected)
}

main()
