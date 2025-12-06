// Authentication resolvers for GitHub OAuth
import { JWT, exchangeGitHubCode, getGitHubUser, generateId, getUserFromToken } from './auth.js';

export function createAuthResolvers(db, env) {
  return {
    Query: {
      me: async (_, __, context) => {
        const userId = await getUserFromToken(
          context.request.headers.get('Authorization'),
          env.JWT_SECRET
        );

        if (!userId) {
          return null;
        }

        const result = await db
          .prepare('SELECT * FROM users WHERE id = ?')
          .bind(userId)
          .first();

        if (!result) {
          return null;
        }

        return {
          id: result.id,
          githubId: result.github_id,
          username: result.username,
          email: result.email,
          avatarUrl: result.avatar_url,
          name: result.name,
          createdAt: result.created_at,
          lastLogin: result.last_login,
        };
      },
    },

    Mutation: {
      authenticateGitHub: async (_, { code }, context) => {
        try {
          // Exchange code for access token
          const accessToken = await exchangeGitHubCode(
            code,
            env.GITHUB_CLIENT_ID,
            env.GITHUB_CLIENT_SECRET
          );

          // Get user info from GitHub
          const githubUser = await getGitHubUser(accessToken);

          // Check if user exists
          const existingUser = await db
            .prepare('SELECT * FROM users WHERE github_id = ?')
            .bind(githubUser.githubId)
            .first();

          let userId;
          let user;

          if (existingUser) {
            // Update existing user
            userId = existingUser.id;
            const now = new Date().toISOString();

            await db
              .prepare(`
                UPDATE users
                SET username = ?, email = ?, avatar_url = ?, name = ?, last_login = ?
                WHERE id = ?
              `)
              .bind(
                githubUser.username,
                githubUser.email,
                githubUser.avatarUrl,
                githubUser.name,
                now,
                userId
              )
              .run();

            user = {
              id: userId,
              githubId: existingUser.github_id,
              username: githubUser.username,
              email: githubUser.email,
              avatarUrl: githubUser.avatarUrl,
              name: githubUser.name,
              createdAt: existingUser.created_at,
              lastLogin: now,
            };
          } else {
            // Create new user
            userId = generateId();
            const now = new Date().toISOString();

            await db
              .prepare(`
                INSERT INTO users (id, github_id, username, email, avatar_url, name, created_at, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `)
              .bind(
                userId,
                githubUser.githubId,
                githubUser.username,
                githubUser.email,
                githubUser.avatarUrl,
                githubUser.name,
                now,
                now
              )
              .run();

            user = {
              id: userId,
              githubId: githubUser.githubId,
              username: githubUser.username,
              email: githubUser.email,
              avatarUrl: githubUser.avatarUrl,
              name: githubUser.name,
              createdAt: now,
              lastLogin: now,
            };
          }

          // Generate JWT token
          const token = await JWT.sign(
            {
              userId: userId,
              githubId: githubUser.githubId,
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
            },
            env.JWT_SECRET
          );

          return {
            success: true,
            token: token,
            user: user,
            error: null,
          };
        } catch (error) {
          console.error('GitHub authentication error:', error);
          return {
            success: false,
            token: null,
            user: null,
            error: error.message,
          };
        }
      },
    },
  };
}
