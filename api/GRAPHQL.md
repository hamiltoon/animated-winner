# GraphQL API Documentation

The Recipe Saver API uses GraphQL for all operations.

## Server Information

- **URL**: `https://recipe-saver-api.hamiltoon.workers.dev/graphql`
- **GraphQL Playground**: `https://recipe-saver-api.hamiltoon.workers.dev/graphql`
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Platform**: Cloudflare Workers (Edge Computing)

## GraphQL Schema

### Types

```graphql
type Recipe {
  id: ID!
  title: String!
  description: String
  ingredients: [String!]!
  instructions: [String!]!
  prepTime: String
  cookTime: String
  totalTime: String
  servings: String
  category: String
  cuisine: String
  image: String
  author: String
  url: String
  source: String
  dateAdded: String!
  dateModified: String
}

type Stats {
  totalRecipes: Int!
  categories: [String!]!
  cuisines: [String!]!
}
```

## Queries

### Get all recipes

```graphql
query {
  recipes {
    id
    title
    ingredients
    instructions
    prepTime
    cookTime
  }
}
```

### Get a single recipe

```graphql
query {
  recipe(id: "abc123") {
    id
    title
    description
    ingredients
    instructions
  }
}
```

### Search recipes

```graphql
query {
  searchRecipes(query: "pasta") {
    id
    title
    category
    cuisine
  }
}
```

### Get statistics

```graphql
query {
  stats {
    totalRecipes
    categories
    cuisines
  }
}
```

### Health check

```graphql
query {
  health
}
```

## Mutations

### Create a recipe

```graphql
mutation {
  createRecipe(input: {
    title: "Spaghetti Carbonara"
    description: "Classic Italian pasta dish"
    ingredients: ["400g spaghetti", "200g pancetta", "4 eggs", "100g parmesan"]
    instructions: ["Boil pasta", "Fry pancetta", "Mix eggs and cheese", "Combine"]
    prepTime: "10 minutes"
    cookTime: "20 minutes"
    servings: "4"
    category: "Pasta"
    cuisine: "Italian"
  }) {
    success
    id
    recipe {
      id
      title
    }
    error
  }
}
```

### Update a recipe

```graphql
mutation {
  updateRecipe(
    id: "abc123"
    input: {
      title: "Updated Title"
      description: "Updated description"
    }
  ) {
    success
    recipe {
      id
      title
      description
    }
    error
  }
}
```

### Delete a recipe

```graphql
mutation {
  deleteRecipe(id: "abc123") {
    success
    error
  }
}
```

### Import recipes

```graphql
mutation {
  importRecipes(recipes: [
    {
      title: "Recipe 1"
      ingredients: ["ingredient 1", "ingredient 2"]
      instructions: ["step 1", "step 2"]
    },
    {
      title: "Recipe 2"
      ingredients: ["ingredient 1", "ingredient 2"]
      instructions: ["step 1", "step 2"]
    }
  ]) {
    success
    imported
    error
  }
}
```

## Example cURL Requests

### Query all recipes

```bash
curl -X POST https://recipe-saver-api.hamiltoon.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ recipes { id title ingredients } }"}'
```

### Create a recipe

```bash
curl -X POST https://recipe-saver-api.hamiltoon.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateRecipe($input: RecipeInput!) { createRecipe(input: $input) { success id } }",
    "variables": {
      "input": {
        "title": "Test Recipe",
        "ingredients": ["ing1", "ing2"],
        "instructions": ["step1", "step2"]
      }
    }
  }'
```

## Advantages of GraphQL

1. **Single Endpoint**: All operations through `/graphql`
2. **Flexible Queries**: Request exactly the fields you need
3. **Type Safety**: Strong typing with schema validation
4. **No Over-fetching**: Get only the data you request
5. **Introspection**: Self-documenting API with GraphQL Playground
6. **Batch Operations**: Multiple queries in a single request

## Testing with GraphQL Playground

Visit `https://recipe-saver-api.hamiltoon.workers.dev/graphql` in your browser to access the interactive GraphQL Playground where you can:

- Explore the schema
- Test queries and mutations
- View documentation
- Use autocomplete for queries

## CORS Support

The API is configured to allow Chrome extension origins:

```javascript
cors: {
  origin: (origin) => {
    if (origin?.startsWith('chrome-extension://')) {
      return origin;
    }
    return '*';
  },
  credentials: true,
}
```

## Error Handling

All mutations return a response with:
- `success`: Boolean indicating if the operation succeeded
- `error`: Error message if the operation failed
- Additional fields specific to the operation

Example error response:
```json
{
  "data": {
    "createRecipe": {
      "success": false,
      "error": "Recipe with this URL already exists"
    }
  }
}
```

## Rate Limits

Cloudflare Workers free tier:
- 100,000 requests per day
- No rate limiting on individual requests
- Automatic DDoS protection

## Performance

- **Cold Start**: ~3ms
- **Response Time**: 20-50ms globally (edge network)
- **Database**: D1 has ~5ms read latency on Workers
