# GitHub OAuth Setup - Quick Start Guide

## Step 1: Create GitHub OAuth App (5 minutes)

1. Go to https://github.com/settings/developers
2. Click **"OAuth Apps"** in the left sidebar
3. Click **"New OAuth App"**
4. Fill in:
   - **Application name**: `Recipe Saver`
   - **Homepage URL**: `https://hamiltoon.github.io/animated-winner/`
   - **Authorization callback URL**: `https://hamiltoon.github.io/animated-winner/auth/callback`
   - **Application description**: `Save and organize recipes from across the web`
5. Click **"Register application"**
6. You'll see your **Client ID** - **copy this**
7. Click **"Generate a new client secret"**
8. **Copy the client secret immediately** (it's only shown once!)

## Step 2: Configure Cloudflare Workers Secrets

Run these commands in your terminal:

```bash
cd api

# Add GitHub Client ID
npx wrangler secret put GITHUB_CLIENT_ID
# When prompted, paste your Client ID and press Enter

# Add GitHub Client Secret
npx wrangler secret put GITHUB_CLIENT_SECRET
# When prompted, paste your Client Secret and press Enter

# Generate and add JWT secret (for signing auth tokens)
npx wrangler secret put JWT_SECRET
# When prompted, paste a random string (you can generate one below)
```

### Generate JWT Secret

Run this to generate a secure random string:
```bash
openssl rand -base64 32
```
Or use: `https://generate-secret.now.sh/32`

## Step 3: Apply Database Migration

```bash
# Apply the users table migration to production database
npx wrangler d1 execute recipe-saver --remote --file=schema-migrations/002_add_users.sql
```

## Step 4: Deploy

```bash
npx wrangler deploy
```

## Step 5: Test

Visit https://hamiltoon.github.io/animated-winner/ and try signing in with GitHub!

## What's Been Implemented

✅ GitHub OAuth authentication flow
✅ JWT token generation and verification
✅ User database table
✅ Recipe-to-user associations
✅ GraphQL mutations: `authenticateGitHub`
✅ GraphQL queries: `me` (get current user)
✅ Recipes automatically linked to logged-in users

## Next Steps

After completing the setup above, you'll need to:
1. Update the GitHub Pages site with a "Sign in with GitHub" button
2. Update the Chrome extension to support authentication

Let me know when you're ready and I'll implement the frontend auth!
