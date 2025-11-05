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

**CRITICAL**: You MUST set up environment secrets before deploying, or the deployment will return a 500 error.

#### Step 1: Authenticate with Cloudflare

```bash
pnpm exec wrangler login
```

This will open a browser window for authentication. If you're in a CI/CD environment, set `CLOUDFLARE_API_TOKEN` instead.

#### Step 2: Set Environment Secrets

**IMPORTANT**: This step is REQUIRED before deployment!

Run the provided setup script:

```bash
chmod +x ./setup-secrets.sh
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

**Critical**: The `BETTER_AUTH_URL` MUST be set to your production domain (`https://hraj.eu`), not localhost!

Verify secrets are set:
```bash
pnpm exec wrangler secret list
```

#### Step 3: Deploy

```bash
pnpm wrdeploy
```

## Troubleshooting

### 500 Error after deployment

If you see `{"status":500,"unhandled":true,"message":"HTTPError"}` after deployment:

**Most common cause**: Environment secrets are not set up. Run `./setup-secrets.sh` first!

Other checks:

1. Verify all secrets are set correctly:
   ```bash
   pnpm exec wrangler secret list
   ```

   You should see all 8 secrets listed:
   - TURSO_DATABASE_URL
   - TURSO_AUTH_TOKEN
   - BETTER_AUTH_SECRET
   - BETTER_AUTH_URL
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - FACEBOOK_CLIENT_ID
   - FACEBOOK_CLIENT_SECRET

2. Check that `BETTER_AUTH_URL` is set to the production URL (`https://hraj.eu`), not localhost

3. View real-time deployment logs:
   ```bash
   pnpm exec wrangler tail
   ```
   Then visit your site in a browser to see the error details.

4. If you see "Missing required environment variables" in logs, re-run `./setup-secrets.sh`

### Environment Variables Not Loading

The app uses lazy loading for environment variables:
- **Development**: Loads from `.dev.vars` file using dotenv
- **Production (Cloudflare Workers)**: Uses `process.env` populated by wrangler secrets
- **Lazy evaluation**: Environment variables are only validated when first accessed, not at module load time

This means:
- Secrets must be set BEFORE deploying
- Environment validation happens at runtime, not build time
- Clear error messages will indicate which secrets are missing
