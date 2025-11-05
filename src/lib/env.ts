import { z } from "zod"

// In development, load from .dev.vars
// In Cloudflare Workers production, environment variables come from wrangler secrets
if (typeof process !== 'undefined' && !process.env.CLOUDFLARE_VERSION) {
  try {
    // Only load dotenv in non-Cloudflare environments
    const dotenv = require('dotenv')
    dotenv.config({ path: '.dev.vars' })
  } catch {
    // Dotenv may not be available or .dev.vars doesn't exist
  }
}

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
}).transform((val) => {
  // Validate that all values are present
  const missing = Object.entries(val).filter(([_, v]) => !v).map(([k]) => k)
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please set them up using wrangler secrets.`)
  }
  return val as Required<typeof val>
})

// Lazy evaluation - parse env on first access
let _env: z.infer<typeof envSchema> | null = null

function loadEnv() {
  if (!_env) {
    _env = envSchema.parse(process.env)
  }
  return _env
}

// Use Proxy for lazy loading - env vars are only validated on first access
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop) {
    const e = loadEnv()
    return e[prop as keyof typeof e]
  }
});
