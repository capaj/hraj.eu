// Override auto-generated types to use proper string types for environment variables
declare namespace Cloudflare {
  interface Env {
    NODE_ENV: string
    TURSO_DATABASE_URL: string
    TURSO_AUTH_TOKEN: string
    BETTER_AUTH_SECRET: string
    BETTER_AUTH_URL: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    FACEBOOK_CLIENT_ID: string
    FACEBOOK_CLIENT_SECRET: string
    RESEND_API_KEY: string
    SENDER_EMAIL: string
    hraj_eu_uploads: R2Bucket
  }
}
