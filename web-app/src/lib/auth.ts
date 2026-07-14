import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../../drizzle/db'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { magicLink } from 'better-auth/plugins'
import { env } from 'cloudflare:workers'
import * as schema from '../../drizzle/schema'
import { Resend } from 'resend'

const resend = new Resend(env.RESEND_API_KEY)

const appName = 'hraj.eu'

async function sendAuthEmail({
  to,
  subject,
  heading,
  body,
  buttonText,
  url,
  expiresIn
}: {
  to: string
  subject: string
  heading: string
  body: string
  buttonText: string
  url: string
  expiresIn: string
}) {
  await resend.emails.send({
    from: env.SENDER_EMAIL,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${heading}</h2>
        <p>${body}</p>
        <a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">${buttonText}</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${url}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in ${expiresIn}. If you didn't request this email, you can safely ignore it.</p>
      </div>
    `
  })
}

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
      timezone: {
        type: 'string',
        input: false
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
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log('Sending password reset link to', user.email)
      await sendAuthEmail({
        to: user.email,
        subject: `Reset your ${appName} password`,
        heading: `Reset your ${appName} password`,
        body: 'Click the button below to choose a new password for your account:',
        buttonText: 'Reset password',
        url,
        expiresIn: '1 hour'
      })
    }
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
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for']
    }
  },
  plugins: [
    tanstackStartCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log('Sending magic link to', email)
        await sendAuthEmail({
          to: email,
          subject: `Sign in to ${appName}`,
          heading: `Sign in to ${appName}`,
          body: 'Click the button below to sign in to your account:',
          buttonText: 'Sign In',
          url,
          expiresIn: '5 minutes'
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
