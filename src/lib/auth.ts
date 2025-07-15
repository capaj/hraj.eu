import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../../drizzle/db'
import { reactStartCookies } from 'better-auth/react-start'
import { env } from './env'
import * as schema from '../../drizzle/schema'
import { SPORTS } from './constants'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema,
      user: schema.user
    }
  }),
  user: {
    additionalFields: {
      karmaPoints: {
        type: 'number',
        input: false,
        default: 0
      },
      preferredCurrency: {
        type: 'string',
        default: 'EUR'
      }
    }
  },
  emailAndPassword: {
    enabled: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
    updateAge: 60 * 60 * 24 * 14 // Update session every two weeks
  },
  trustedOrigins: ['http://localhost:3000', 'https://hraj.eu'],
  plugins: [reactStartCookies()],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    },
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET
    }
  }
})
