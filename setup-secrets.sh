#!/bin/bash

# Script to set up Cloudflare secrets for production deployment
# Run this script after authenticating with: wrangler login

echo "Setting up Cloudflare Workers secrets..."
echo ""

# TURSO_DATABASE_URL
echo "libsql://hrajeu-capaj.aws-eu-west-1.turso.io" | pnpm exec wrangler secret put TURSO_DATABASE_URL

# TURSO_AUTH_TOKEN
echo "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTExNjIzNTgsImlkIjoiNTU0ZmY2MGYtY2EzMy00ZDlhLWE0YTQtMzM1MWNjY2VjMDJhIiwicmlkIjoiNDQwN2ExYzYtOWQxOS00YzFiLWEwZGQtM2NiNTBmZTVkZDBiIn0.dQegIfAQwmDqdMHesyKa2vrxhjUlbQ0eqZGNipWmlAykhKz7UpK1kgF2soo0K4o0CcFJEau6BrQ9gPX4-QvZBA" | pnpm exec wrangler secret put TURSO_AUTH_TOKEN

# BETTER_AUTH_SECRET
echo "PzyErgY1I8bNX4uwNTBIrqrJ4eZqx0vz" | pnpm exec wrangler secret put BETTER_AUTH_SECRET

# BETTER_AUTH_URL - Note: Using production URL
echo "https://hraj.eu" | pnpm exec wrangler secret put BETTER_AUTH_URL

# GOOGLE_CLIENT_ID
echo "283001109128-he4lpvd6o7vl9eurh8pn7ittkhikfrvb.apps.googleusercontent.com" | pnpm exec wrangler secret put GOOGLE_CLIENT_ID

# GOOGLE_CLIENT_SECRET
echo "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" | pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET

# FACEBOOK_CLIENT_ID
echo "311467912374535" | pnpm exec wrangler secret put FACEBOOK_CLIENT_ID

# FACEBOOK_CLIENT_SECRET
echo "4312000f6ab3406617f98e2a87fe2ae7" | pnpm exec wrangler secret put FACEBOOK_CLIENT_SECRET

echo ""
echo "All secrets have been set! You can now deploy with: pnpm wrdeploy"
