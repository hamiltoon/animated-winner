// Recipe Saver GraphQL API for Cloudflare Workers
import { createYoga } from 'graphql-yoga';
import { createSchema } from './schema.js';
import { createResolvers } from './resolvers.js';

export default {
  async fetch(request, env, ctx) {
    // Create GraphQL Yoga instance
    const yoga = createYoga({
      schema: createSchema(createResolvers(env.DB)),

      // Enable GraphiQL playground in development
      graphiql: env.ENVIRONMENT !== 'production',

      // CORS configuration for Chrome extension
      cors: {
        origin: (origin) => {
          // Allow Chrome extension origins
          if (origin?.startsWith('chrome-extension://')) {
            return origin;
          }
          // Allow localhost for development
          if (origin?.includes('localhost')) {
            return origin;
          }
          // Default allow for now (restrict in production)
          return '*';
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },

      // Logging in development
      logging: env.ENVIRONMENT !== 'production',
    });

    // Handle the request
    return yoga.fetch(request, env, ctx);
  },
};
