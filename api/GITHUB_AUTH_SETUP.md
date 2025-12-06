# GitHub OAuth Setup Guide

## 1. Create GitHub OAuth App

1. Go to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   ```
   Application name: Recipe Saver
   Homepage URL: https://hamiltoon.github.io/animated-winner/
   Authorization callback URL: https://hamiltoon.github.io/animated-winner/auth/callback
   ```
4. Click "Register application"
5. You'll see your **Client ID** - copy this
6. Click "Generate a new client secret" - copy the **Client Secret** (only shown once!)

## 2. Configure Cloudflare Workers Secrets

Run these commands to add the secrets to your Cloudflare Worker:

```bash
cd api

# Add GitHub OAuth Client ID
npx wrangler secret put GITHUB_CLIENT_ID
# Paste your Client ID when prompted

# Add GitHub OAuth Client Secret
npx wrangler secret put GITHUB_CLIENT_SECRET
# Paste your Client Secret when prompted

# Add JWT secret for signing tokens
npx wrangler secret put JWT_SECRET
# Enter a random string (e.g., generated with: openssl rand -base64 32)
```

## 3. Apply Database Migration

```bash
# Apply the users table migration
npx wrangler d1 execute recipe-saver --remote --file=schema-migrations/002_add_users.sql
```

## 4. Deploy Updated API

```bash
npx wrangler deploy
```

## 5. Update Chrome Extension Manifest

For Chrome extension OAuth, you'll need to add the OAuth redirect URL to your manifest.json:

```json
{
  "oauth2": {
    "client_id": "YOUR_GITHUB_CLIENT_ID",
    "scopes": ["user:email"]
  }
}
```

## OAuth Flow

### For GitHub Pages (Web):
1. User clicks "Sign in with GitHub"
2. Redirect to GitHub OAuth: `https://github.com/login/oauth/authorize?client_id=...`
3. GitHub redirects back to: `https://hamiltoon.github.io/animated-winner/auth/callback?code=...`
4. Frontend sends code to API endpoint: `/auth/github/callback`
5. API exchanges code for access token with GitHub
6. API fetches user info from GitHub
7. API creates/updates user in database
8. API returns JWT to frontend
9. Frontend stores JWT and uses it for authenticated requests

### For Chrome Extension:
Similar flow but uses `chrome.identity.launchWebAuthFlow()` for better UX.

## Environment Variables

Add these to your local `.dev.vars` file for local testing:

```
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
JWT_SECRET=your_random_secret_here
```

## Testing

After setup, test the auth flow:

1. Visit https://hamiltoon.github.io/animated-winner/
2. Click "Sign in with GitHub"
3. Authorize the app
4. You should be redirected back and logged in
5. Your recipes should now be associated with your GitHub account

## Security Notes

- Client Secret must NEVER be exposed in frontend code
- All token exchanges happen server-side (Cloudflare Workers)
- JWT tokens should be short-lived (e.g., 7 days)
- Use HTTPS for all OAuth redirects
- Store JWT in httpOnly cookies or secure localStorage
