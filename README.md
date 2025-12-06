# Recipe Saver Chrome Extension

A Chrome extension that extracts recipes from web pages and saves them to a SQLite database via a GraphQL API backend.

## Architecture

- **Frontend**: Chrome Extension (popup, content script)
- **Backend**: Cloudflare Workers + GraphQL Yoga + D1 (`api/`)
- **Database**: Cloudflare D1 (SQLite-compatible, edge-deployed)

## Features

- Extract recipes from web pages using schema.org markup
- Save recipes to SQLite database
- Search recipes by title, ingredients, category, cuisine
- View recipe details with ingredients and instructions
- Export/Import recipes as JSON
- GraphQL API for all operations with type safety

## Project Structure

```
.
├── api/                  # Cloudflare Workers API
│   ├── src/
│   │   ├── index.js      # Worker entry point
│   │   ├── resolvers.js  # GraphQL resolvers (D1)
│   │   ├── schema.js     # Schema builder
│   │   └── schema.graphql # GraphQL schema
│   ├── schema.sql        # D1 database schema
│   ├── wrangler.toml     # Cloudflare configuration
│   ├── package.json      # Dependencies
│   ├── README.md         # Deployment guide
│   └── MIGRATION.md      # Migration notes
├── plugin/               # Chrome extension
│   ├── manifest.json     # Extension manifest
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Popup styles
│   ├── popup.js          # Popup logic
│   ├── content.js        # Content script for recipe extraction
│   ├── storage.js        # GraphQL client
│   └── README.md         # Extension guide
└── README.md             # This file
```

## Setup Instructions

### 1. Deploy the API to Cloudflare Workers

The API is deployed on Cloudflare's global edge network for free:

```bash
cd api
npm install
npx wrangler login
npx wrangler d1 create recipe-saver
# Update wrangler.toml with the database_id from the output
npx wrangler d1 execute recipe-saver --file=schema.sql --remote
npx wrangler deploy
```

See [api/README.md](api/README.md) for detailed deployment instructions.

**Deployed API:** https://recipe-saver-api.hamiltoon.workers.dev/graphql

### 2. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `plugin` directory
5. The extension should now appear in your extensions list

### 3. Update API Endpoint (if needed)

The extension is configured to use the deployed API. If you deployed to a different URL, update `plugin/storage.js`:

```javascript
const GRAPHQL_URL = 'https://recipe-saver-api.hamiltoon.workers.dev/graphql';
```

### 4. Test the Extension

1. Navigate to any recipe website (e.g., allrecipes.com, foodnetwork.com)
2. Click the Recipe Saver extension icon
3. Click "Save Recipe from Page"
4. The recipe will be extracted and saved to Cloudflare D1

## GraphQL API

The API is deployed on Cloudflare Workers and uses GraphQL.

**API Endpoint:** https://recipe-saver-api.hamiltoon.workers.dev/graphql

See [api/GRAPHQL.md](api/GRAPHQL.md) for complete API documentation.

### Quick Examples

**Get all recipes:**
```graphql
query {
  recipes {
    id
    title
    ingredients
  }
}
```

**Create a recipe:**
```graphql
mutation {
  createRecipe(input: {
    title: "Pasta"
    ingredients: ["pasta", "sauce"]
    instructions: ["boil", "mix"]
  }) {
    success
    id
  }
}
```

**Search recipes:**
```graphql
query {
  searchRecipes(query: "pasta") {
    id
    title
  }
}
```

For more examples and complete documentation, see [api/GRAPHQL.md](api/GRAPHQL.md).

## How It Works

1. **Recipe Detection**: Content script (`content.js`) scans web pages for:
   - Schema.org Recipe JSON-LD markup (most recipe sites use this)
   - Common HTML patterns for recipes

2. **Data Extraction**: Extracts:
   - Title, description, author
   - Ingredients list
   - Step-by-step instructions
   - Cook time, prep time, servings
   - Category, cuisine
   - Source URL and image

3. **Storage**: Data is sent to the GraphQL API which:
   - Validates against the GraphQL schema
   - Stores it in SQLite with proper indexes
   - Returns typed success/failure response

4. **Retrieval**: Extension fetches recipes via GraphQL queries and displays them in a clean interface

## Development

### Testing the API

You can test the GraphQL API using the interactive playground at `http://localhost:4000/` or with curl:

```bash
# Health check
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health }"}'

# Get all recipes
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ recipes { id title } }"}'

# Search recipes
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ searchRecipes(query: \"pasta\") { id title } }"}'
```

For more examples, see [api/GRAPHQL.md](api/GRAPHQL.md).

### Debugging

- Check the server console for API errors
- Open Chrome DevTools on the extension popup to see frontend errors
- Check `chrome://extensions/` for extension errors

## Notes

- The API server must be running for the extension to work
- Database file (`recipes.db`) is created automatically in the `api` directory
- Recipes are deduplicated by URL when importing
- All recipe fields support Unicode (international recipes)

## GraphQL Benefits

- **Type Safety**: Strong typing with schema validation
- **Flexible Queries**: Request exactly the fields you need
- **Single Endpoint**: All operations through `/graphql`
- **Self-Documenting**: Interactive GraphQL Playground
- **No Over-fetching**: Get only the data you request

## Future Enhancements

- Add authentication for multi-user support
- Deploy API to a cloud server
- Add recipe tags and ratings
- Support for recipe images upload
- Meal planning features
- Shopping list generation