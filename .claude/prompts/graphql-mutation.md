# GraphQL Mutation Template

When adding new GraphQL mutations to the API:

## Schema Definition (api/src/schema.graphql)
```graphql
type Mutation {
  mutationName(input: MutationInput!): MutationResponse!
}

input MutationInput {
  field1: String!
  field2: Int
}

type MutationResponse {
  success: Boolean!
  message: String
  data: DataType
  error: String
}
```

## Resolver (api/src/resolvers.js)
```javascript
Mutation: {
  mutationName: async (_, { input }, context) => {
    try {
      // Verify user is authenticated
      if (!context.user) {
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      // Perform database operation
      const result = await context.env.DB.prepare(
        'INSERT INTO table_name (field1, field2, user_id) VALUES (?, ?, ?)'
      ).bind(input.field1, input.field2, context.user.id).run();

      return {
        success: true,
        message: 'Operation completed successfully',
        data: { id: result.meta.last_row_id },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
}
```

## Frontend Usage (web/src/lib/api.js)
```javascript
export async function mutationName(input) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.getToken()}`,
    },
    body: JSON.stringify({
      query: `
        mutation MutationName($input: MutationInput!) {
          mutationName(input: $input) {
            success
            message
            error
          }
        }
      `,
      variables: { input },
    }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data.mutationName;
}
```
