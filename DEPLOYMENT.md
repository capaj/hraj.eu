# Deployment Guide

## Environment Setup

This project uses Cloudflare Workers for hosting and requires proper environment variable configuration.

### Local Development

Environment variables for local development are stored in `.dev.vars` file (already configured).

To run locally:
```bash
pnpm dev
```

### Production Deployment to Cloudflare Workers

Before deploying to production, you need to set up environment secrets in Cloudflare Workers.

#### Step 1: Authenticate with Cloudflare

```bash
pnpm exec wrangler login
```

#### Step 2: Set Environment Secrets

Run the provided setup script:

```bash
./setup-secrets.sh
```

Or manually set each secret:

```bash
echo "libsql://hrajeu-capaj.aws-eu-west-1.turso.io" | pnpm exec wrangler secret put TURSO_DATABASE_URL
echo "YOUR_TURSO_TOKEN" | pnpm exec wrangler secret put TURSO_AUTH_TOKEN
echo "YOUR_BETTER_AUTH_SECRET" | pnpm exec wrangler secret put BETTER_AUTH_SECRET
echo "https://hraj.eu" | pnpm exec wrangler secret put BETTER_AUTH_URL
echo "YOUR_GOOGLE_CLIENT_ID" | pnpm exec wrangler secret put GOOGLE_CLIENT_ID
echo "YOUR_GOOGLE_CLIENT_SECRET" | pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
echo "YOUR_FACEBOOK_CLIENT_ID" | pnpm exec wrangler secret put FACEBOOK_CLIENT_ID
echo "YOUR_FACEBOOK_CLIENT_SECRET" | pnpm exec wrangler secret put FACEBOOK_CLIENT_SECRET
```

**Important**: The `BETTER_AUTH_URL` must be set to your production domain (`https://hraj.eu`), not localhost!

#### Step 3: Deploy

```bash
pnpm wrdeploy
```

## Troubleshooting

### 500 Error after deployment

If you see `{"status":500,"unhandled":true,"message":"HTTPError"}` after deployment:

1. Verify all secrets are set correctly:
   ```bash
   pnpm exec wrangler secret list
   ```

2. Check that `BETTER_AUTH_URL` is set to the production URL (`https://hraj.eu`), not localhost

3. View deployment logs:
   ```bash
   pnpm exec wrangler tail
   ```

### Environment Variables Not Loading

The app uses different methods for loading environment variables:
- **Development**: Loads from `.dev.vars` file using dotenv
- **Production (Cloudflare Workers)**: Uses `process.env` populated by wrangler secrets

The detection is automatic based on the `CLOUDFLARE_VERSION` environment variable.
