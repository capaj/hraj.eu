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
    console.warn('Could not load .dev.vars file')
  }
}

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string(),
  TURSO_AUTH_TOKEN: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  FACEBOOK_CLIENT_ID: z.string(),
  FACEBOOK_CLIENT_SECRET: z.string(),
})

export const env = envSchema.parse(process.env);
