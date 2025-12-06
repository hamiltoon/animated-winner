// GraphQL Resolvers for Cloudflare D1
// Cloudflare D1 uses async/await API instead of sql.js's synchronous API

import { getUserFromToken } from './auth.js';

// Helper function to generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function createResolvers(db, env) {
  return {
    Recipe: {
      user: async (parent) => {
        if (!parent.user_id) {
          return null;
        }

        const result = await db
          .prepare('SELECT * FROM users WHERE id = ?')
          .bind(parent.user_id)
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
    Query: {
      health: () => 'Recipe Saver GraphQL API is running on Cloudflare Workers',

      recipes: async (_, __, context) => {
        // Require authentication to view recipes
        const userId = await getUserFromToken(
          context.request.headers.get('Authorization'),
          env.JWT_SECRET
        );

        if (!userId) {
          throw new Error('Authentication required');
        }

        const result = await db.prepare('SELECT * FROM recipes ORDER BY dateAdded DESC').all();

        return result.results.map(row => ({
          ...row,
          ingredients: JSON.parse(row.ingredients || '[]'),
          instructions: JSON.parse(row.instructions || '[]'),
        }));
      },

      recipe: async (_, { id }) => {
        const result = await db.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();

        if (!result) return null;

        return {
          ...result,
          ingredients: JSON.parse(result.ingredients || '[]'),
          instructions: JSON.parse(result.instructions || '[]'),
        };
      },

      searchRecipes: async (_, { query }) => {
        const searchTerm = `%${query}%`;
        const result = await db.prepare(`
          SELECT * FROM recipes
          WHERE title LIKE ?
             OR description LIKE ?
             OR category LIKE ?
             OR cuisine LIKE ?
             OR ingredients LIKE ?
          ORDER BY dateAdded DESC
        `).bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm).all();

        return result.results.map(row => ({
          ...row,
          ingredients: JSON.parse(row.ingredients || '[]'),
          instructions: JSON.parse(row.instructions || '[]'),
        }));
      },

      stats: async (_, __, context) => {
        // Require authentication to view stats
        const userId = await getUserFromToken(
          context.request.headers.get('Authorization'),
          env.JWT_SECRET
        );

        if (!userId) {
          throw new Error('Authentication required');
        }

        const countResult = await db.prepare('SELECT COUNT(*) as count FROM recipes').first();
        const categoriesResult = await db.prepare('SELECT DISTINCT category FROM recipes WHERE category != ""').all();
        const cuisinesResult = await db.prepare('SELECT DISTINCT cuisine FROM recipes WHERE cuisine != ""').all();

        return {
          totalRecipes: countResult.count,
          categories: categoriesResult.results.map(row => row.category),
          cuisines: cuisinesResult.results.map(row => row.cuisine),
        };
      },
    },

    Mutation: {
      createRecipe: async (_, { input }, context) => {
        try {
          const id = input.id || generateId();
          const dateAdded = input.dateAdded || new Date().toISOString();
          const dateModified = new Date().toISOString();

          // Get user ID from auth token (optional - recipes can be created without auth)
          const userId = await getUserFromToken(
            context.request.headers.get('Authorization'),
            env.JWT_SECRET
          );

          await db.prepare(`
            INSERT INTO recipes (
              id, title, description, ingredients, instructions,
              prepTime, cookTime, totalTime, servings, category,
              cuisine, image, author, url, source, dateAdded, dateModified, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            input.title || '',
            input.description || '',
            JSON.stringify(input.ingredients || []),
            JSON.stringify(input.instructions || []),
            input.prepTime || '',
            input.cookTime || '',
            input.totalTime || '',
            input.servings || '',
            input.category || '',
            input.cuisine || '',
            input.image || '',
            input.author || '',
            input.url || '',
            input.source || '',
            dateAdded,
            dateModified,
            userId || null
          ).run();

          return {
            success: true,
            id,
            recipe: {
              ...input,
              id,
              dateAdded,
              dateModified,
              userId,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      },

      updateRecipe: async (_, { id, input }) => {
        try {
          // Check if recipe exists
          const exists = await db.prepare('SELECT id FROM recipes WHERE id = ?').bind(id).first();

          if (!exists) {
            return {
              success: false,
              error: 'Recipe not found',
            };
          }

          const dateModified = new Date().toISOString();

          await db.prepare(`
            UPDATE recipes SET
              title = ?,
              description = ?,
              ingredients = ?,
              instructions = ?,
              prepTime = ?,
              cookTime = ?,
              totalTime = ?,
              servings = ?,
              category = ?,
              cuisine = ?,
              image = ?,
              author = ?,
              url = ?,
              source = ?,
              dateModified = ?
            WHERE id = ?
          `).bind(
            input.title,
            input.description || '',
            JSON.stringify(input.ingredients || []),
            JSON.stringify(input.instructions || []),
            input.prepTime || '',
            input.cookTime || '',
            input.totalTime || '',
            input.servings || '',
            input.category || '',
            input.cuisine || '',
            input.image || '',
            input.author || '',
            input.url || '',
            input.source || '',
            dateModified,
            id
          ).run();

          // Fetch updated recipe
          const updated = await db.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();

          return {
            success: true,
            recipe: {
              ...updated,
              ingredients: JSON.parse(updated.ingredients || '[]'),
              instructions: JSON.parse(updated.instructions || '[]'),
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      },

      deleteRecipe: async (_, { id }) => {
        try {
          // Check if recipe exists
          const exists = await db.prepare('SELECT id FROM recipes WHERE id = ?').bind(id).first();

          if (!exists) {
            return {
              success: false,
              error: 'Recipe not found',
            };
          }

          await db.prepare('DELETE FROM recipes WHERE id = ?').bind(id).run();

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      },

      importRecipes: async (_, { recipes }) => {
        try {
          // Get existing URLs to avoid duplicates
          const existingResult = await db.prepare('SELECT url FROM recipes').all();
          const existingUrls = new Set(existingResult.results.map(row => row.url));

          let imported = 0;

          for (const recipe of recipes) {
            // Skip if URL already exists
            if (existingUrls.has(recipe.url)) {
              continue;
            }

            const id = generateId();
            const dateAdded = recipe.dateAdded || new Date().toISOString();
            const dateModified = new Date().toISOString();

            await db.prepare(`
              INSERT INTO recipes (
                id, title, description, ingredients, instructions,
                prepTime, cookTime, totalTime, servings, category,
                cuisine, image, author, url, source, dateAdded, dateModified
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              id,
              recipe.title || '',
              recipe.description || '',
              JSON.stringify(recipe.ingredients || []),
              JSON.stringify(recipe.instructions || []),
              recipe.prepTime || '',
              recipe.cookTime || '',
              recipe.totalTime || '',
              recipe.servings || '',
              recipe.category || '',
              recipe.cuisine || '',
              recipe.image || '',
              recipe.author || '',
              recipe.url || '',
              recipe.source || '',
              dateAdded,
              dateModified
            ).run();

            imported++;
          }

          return {
            success: true,
            imported,
          };
        } catch (error) {
          return {
            success: false,
            imported: 0,
            error: error.message,
          };
        }
      },
    },
  };
}
