import { db } from '../../web-app/drizzle/db'
import { runScheduledJob } from './scheduled'
import type { Env } from './types'
import { syncFioPayments } from '../../web-app/src/lib/fio/sync'

export default {
	async fetch(req) {
		const url = new URL(req.url)
		url.pathname = '/__scheduled'
		url.searchParams.append('cron', '0 * * * *')
		return new Response(
			`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`
		)
	},

	async scheduled(event, env, _ctx): Promise<void> {
		if (env.FIO_TOKEN_ENCRYPTION_KEY) {
			try {
				await syncFioPayments(db, env.FIO_TOKEN_ENCRYPTION_KEY)
			} catch {
				console.error('Fio payment checks could not run')
			}
		}
		if (event.cron === '0 * * * *') await runScheduledJob({ event, env, database: db })
	}
} satisfies ExportedHandler<Env>
