export {}

declare global {
  namespace Cloudflare {
    interface Env {
      TURSO_AUTH_TOKEN: string
      RESEND_API_KEY: string
      GOOGLE_CLIENT_SECRET: string
      FACEBOOK_CLIENT_ID: string
      FACEBOOK_CLIENT_SECRET: string
      GOOGLE_MAPS_API_KEY: string
    }
  }
}
