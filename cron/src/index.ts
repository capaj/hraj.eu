import { db } from '../../web-app/drizzle/db'
import { runScheduledJob } from './scheduled'
import type { Env } from './types'

export default {
	async fetch(req) {
		const url = new URL(req.url)
		url.pathname = '/__scheduled'
		url.searchParams.append('cron', '*/30 * * * *')
		return new Response(
			`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`
		)
	},

	async scheduled(event, env, _ctx): Promise<void> {
		await runScheduledJob({ event, env, database: db })
	}
} satisfies ExportedHandler<Env>
