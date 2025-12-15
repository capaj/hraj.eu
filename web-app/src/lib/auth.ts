import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../../drizzle/db'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { magicLink } from 'better-auth/plugins'
import { env } from 'cloudflare:workers'
import * as schema from '../../drizzle/schema'
import { Resend } from 'resend'

const resend = new Resend(env.RESEND_API_KEY)

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
      },
      preferredCurrency: {
        type: 'string',
        input: true,
        defaultValue: 'CZK'
      },
      location: {
        type: 'string',
        input: false
      },
      bio: {
        type: 'string',
        input: false
      },
      // better-auth doesn't support json type directly in additionalFields for inference in the same way, 
      // but defining it helps if we strictly used better-auth's schema management.
      // Since we use drizzle adapter, this is mostly for the client session type augmentation if usage conforms.
      // However, complex types might need manual handling in custom schema or type extensions.
      // Let's at least add simple string fields.
      revolutTag: {
        type: 'string',
        input: false
      },
      bankAccount: {
          type: 'string',
          input: false
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
  trustedOrigins: ['http://localhost:5173', 'https://hraj.eu'],
  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log('Sending magic link to', email)
        await resend.emails.send({
          from: env.SENDER_EMAIL,
          to: email,
          subject: 'Sign in to hraj.eu',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Sign in to hraj.eu</h2>
              <p>Click the button below to sign in to your account:</p>
              <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Sign In</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${url}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 5 minutes. If you didn't request this email, you can safely ignore it.</p>
            </div>
          `
        })
      }
    })
  ],
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
