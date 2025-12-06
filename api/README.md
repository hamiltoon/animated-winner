# Recipe Saver API - Cloudflare Workers

GraphQL API for Recipe Saver Chrome Extension, deployed on Cloudflare Workers with D1 database.

## Technology Stack

- **Platform**: Cloudflare Workers (Edge Computing)
- **GraphQL Server**: GraphQL Yoga v5
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Wrangler CLI

## Project Structure

```
cloudflare-api/
├── src/
│   ├── index.js          # Worker entry point
│   ├── schema.js         # GraphQL schema builder
│   ├── schema.graphql    # GraphQL type definitions
│   └── resolvers.js      # GraphQL resolvers (D1 database)
├── schema.sql            # D1 database schema
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## Prerequisites

1. **Cloudflare Account** (free tier works great!)
   - Sign up at https://dash.cloudflare.com/sign-up

2. **Node.js** v18+ and npm

3. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   # or use npx wrangler
   ```

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd cloudflare-api
npm install
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

### Step 3: Create D1 Database

```bash
wrangler d1 create recipe-saver
```

**Important:** Copy the `database_id` from the output and update it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "recipe-saver"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste the ID here
```

### Step 4: Create Database Schema

```bash
wrangler d1 execute recipe-saver --file=schema.sql
```

This creates the `recipes` table and indexes.

### Step 5: (Optional) Import Existing Data

If you have data from the local API (`../api/recipes.db`):

```bash
# Export from existing database to SQL
sqlite3 ../api/recipes.db .dump > data.sql

# Import to D1
wrangler d1 execute recipe-saver --file=data.sql
```

### Step 6: Test Locally

```bash
npm run dev
# or
wrangler dev
```

The API will be available at `http://localhost:8787/graphql`

Open GraphiQL playground: `http://localhost:8787/graphql`

### Step 7: Deploy to Production

```bash
npm run deploy
# or
wrangler deploy
```

Your API will be deployed to: `https://recipe-saver-api.YOUR_SUBDOMAIN.workers.dev`

## Development

### Local Development

```bash
npm run dev
```

- Uses local D1 database
- Hot reload enabled
- GraphiQL playground available

### Environment Variables

For local development, create `.dev.vars`:

```bash
ENVIRONMENT=development
```

For production, variables are set in `wrangler.toml`.

## Testing GraphQL Queries

### Health Check

```graphql
query {
  health
}
```

### Get All Recipes

```graphql
query {
  recipes {
    id
    title
    ingredients
    instructions
  }
}
```

### Create Recipe

```graphql
mutation {
  createRecipe(input: {
    title: "Test Recipe"
    ingredients: ["ingredient 1", "ingredient 2"]
    instructions: ["step 1", "step 2"]
  }) {
    success
    id
    recipe {
      id
      title
    }
  }
}
```

### Search Recipes

```graphql
query {
  searchRecipes(query: "pasta") {
    id
    title
    category
  }
}
```

## Database Management

### Query D1 Database

```bash
# Interactive shell
wrangler d1 execute recipe-saver --command="SELECT * FROM recipes LIMIT 5"

# Or open interactive mode
wrangler d1 execute recipe-saver
```

### Backup Database

```bash
# Export all data
wrangler d1 export recipe-saver --output=backup.sql
```

### View Database Info

```bash
wrangler d1 info recipe-saver
```

## Deployment Environments

### Development

```bash
wrangler dev
```

Local only, uses local D1 database.

### Staging (Optional)

```bash
wrangler deploy --env staging
```

Deploys to: `https://staging.recipe-saver-api.YOUR_SUBDOMAIN.workers.dev`

### Production

```bash
wrangler deploy --env production
# or
npm run deploy
```

Deploys to: `https://recipe-saver-api.YOUR_SUBDOMAIN.workers.dev`

## Updating Chrome Extension

After deploying, update the GraphQL endpoint in `../plugin/storage.js`:

```javascript
// Change from:
const GRAPHQL_URL = 'http://localhost:4000/graphql';

// To:
const GRAPHQL_URL = 'https://recipe-saver-api.YOUR_SUBDOMAIN.workers.dev/graphql';
```

## CORS Configuration

The API is configured to allow Chrome extension origins. See `src/index.js`:

```javascript
cors: {
  origin: (origin) => {
    if (origin?.startsWith('chrome-extension://')) {
      return origin;
    }
    return '*';  // Adjust for production
  },
  credentials: true,
}
```

## Monitoring & Logs

### View Logs

```bash
wrangler tail
```

Real-time logs from your Worker.

### View Analytics

Visit: https://dash.cloudflare.com/
- Navigate to Workers & Pages
- Select `recipe-saver-api`
- View metrics, logs, and analytics

## Troubleshooting

### Error: "D1 database not found"

Make sure you:
1. Created the database: `wrangler d1 create recipe-saver`
2. Updated `database_id` in `wrangler.toml`
3. Ran migrations: `wrangler d1 execute recipe-saver --file=schema.sql`

### Error: "Cannot read schema.graphql"

The schema file is read at build time. Make sure `src/schema.graphql` exists.

### CORS Issues from Chrome Extension

Check that your Chrome extension ID is allowed in `src/index.js` CORS configuration.

## Performance

- **Cold Start**: ~10ms (GraphQL Yoga is optimized for Workers)
- **Response Time**: ~20-50ms globally (edge network)
- **Database**: D1 has ~5ms read latency on Workers

## Limits & Pricing

### Free Tier (Generous!)

- **Workers**: 100,000 requests/day
- **D1 Database**:
  - 5GB storage
  - 5 million rows read/day (starting Feb 10, 2025)
  - 100,000 rows written/day

### Paid Tier

- **Workers**: $5/month for unlimited requests
- **D1**: Included in Workers Paid plan with higher limits

See: https://developers.cloudflare.com/workers/platform/pricing/

## Migration from Local API

This Cloudflare Workers version replaces the local Node.js API (`../api/`).

**Key Differences:**
- ✅ Global edge deployment (faster worldwide)
- ✅ No server to maintain
- ✅ Automatic scaling
- ✅ Free hosting (generous limits)
- ⚠️ D1 uses async API (different from sql.js)
- ⚠️ No file system (database is in D1, not local file)

## Next Steps

1. ✅ Deploy API to Cloudflare Workers
2. ✅ Update Chrome extension API endpoint
3. ✅ Test extension with deployed API
4. 📋 Set up custom domain (optional)
5. 📋 Configure production CORS settings
6. 📋 Add API authentication (if needed)

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [GraphQL Yoga Docs](https://the-guild.dev/graphql/yoga-server)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)

## Support

For issues or questions:
- Cloudflare Workers: https://discord.gg/cloudflaredev
- GraphQL Yoga: https://github.com/dotansimha/graphql-yoga/discussions
