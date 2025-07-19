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
        input: false
      },
      preferredCurrency: {
        type: 'string',
        input: true,
        defaultValue: 'CZK'
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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'facebook']
    }
  },
  trustedOrigins: ['http://localhost:3000', 'https://hraj.eu'],
  plugins: [reactStartCookies()],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      overrideUserInfoOnSignIn: true, // This will update user info on every sign-in
      scopes: ['profile', 'email'] // Ensure we get profile and email scopes
    },
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET
    }
  }
})
