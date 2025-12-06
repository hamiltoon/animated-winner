# Migration Guide: Local API → Cloudflare Workers

This guide explains the differences between the local Node.js API and the Cloudflare Workers version.

## Key Changes

### 1. GraphQL Server

**Before (Local API):**
- Apollo Server v4
- Standalone HTTP server
- Node.js runtime

**After (Cloudflare Workers):**
- GraphQL Yoga v5
- Cloudflare Workers runtime
- WHATWG Fetch API

### 2. Database

**Before (Local API):**
- sql.js (JavaScript SQLite)
- Synchronous API (`stmt.step()`, `stmt.getAsObject()`)
- File-based storage (`recipes.db` file)
- Manual persistence (`db.export()`, `fs.writeFile()`)

**After (Cloudflare Workers):**
- Cloudflare D1 (SQLite-compatible)
- Async/await API (`db.prepare().all()`, `.first()`)
- Cloud-based storage (managed by Cloudflare)
- Automatic persistence (no manual saves needed)

### 3. Code Differences

#### Querying Data

**sql.js (Before):**
```javascript
const stmt = db.prepare('SELECT * FROM recipes');
const rows = [];
while (stmt.step()) {
  const row = stmt.getAsObject();
  rows.push(row);
}
stmt.free();
return rows;
```

**D1 (After):**
```javascript
const result = await db.prepare('SELECT * FROM recipes').all();
return result.results;
```

#### Inserting Data

**sql.js (Before):**
```javascript
db.run('INSERT INTO recipes (id, title) VALUES (?, ?)', [id, title]);
await saveDatabase(); // Manual save
```

**D1 (After):**
```javascript
await db.prepare('INSERT INTO recipes (id, title) VALUES (?, ?)').bind(id, title).run();
// Automatic persistence
```

## Migration Checklist

- [x] Create Cloudflare account
- [x] Install Wrangler CLI
- [x] Create D1 database
- [x] Import existing data (optional)
- [x] Update resolvers to use async/await
- [x] Replace Apollo Server with GraphQL Yoga
- [x] Configure CORS for Chrome extension
- [x] Test locally with `wrangler dev`
- [x] Deploy to production
- [ ] Update Chrome extension API endpoint
- [ ] Test with deployed API

## Benefits of Cloudflare Workers

1. **Global Edge Network**: API runs in 300+ cities worldwide
2. **Auto-scaling**: Handles traffic spikes automatically
3. **Free Tier**: 100,000 requests/day free
4. **No Server Management**: Fully serverless
5. **Fast Cold Starts**: ~10ms (vs 2-3s for AWS Lambda)
6. **Built-in Security**: DDoS protection, automatic HTTPS

## Performance Comparison

| Metric | Local API | Cloudflare Workers |
|--------|-----------|-------------------|
| Cold Start | N/A (always running) | ~10ms |
| Response Time | 20-100ms (local) | 20-50ms (global) |
| Global Latency | High (single server) | Low (edge network) |
| Uptime | Depends on your server | 99.99% SLA |
| Cost | Server hosting | Free tier / $5/month |

## Rollback Plan

If you need to rollback to the local API:

1. Keep the `api/` directory as-is
2. Revert Chrome extension to use `http://localhost:4000/graphql`
3. Start local server: `cd api && npm start`

The local API remains fully functional and can be used alongside the Cloudflare Workers version.
