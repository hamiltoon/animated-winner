---
description: Test the GraphQL API with common queries
---

Test the GraphQL API with various queries and mutations.

Use curl or the GraphQL playground to test:

**Health Check:**
```bash
curl -X POST https://recipe-saver-api.hamiltoon.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}'
```

**Get Recipes (requires auth):**
```bash
curl -X POST https://recipe-saver-api.hamiltoon.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "{ recipes { id title ingredients } }"}'
```

**Search Recipes:**
```bash
curl -X POST https://recipe-saver-api.hamiltoon.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "{ searchRecipes(query: \"pasta\") { id title } }"}'
```

Or open the interactive playground at: https://recipe-saver-api.hamiltoon.workers.dev/graphql
