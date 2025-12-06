// Database storage module using GraphQL API with SQLite backend
// All operations call the GraphQL backend server

const GRAPHQL_URL = 'https://recipe-saver-api.hamiltoon.workers.dev/graphql';

const RecipeStorage = {
  // Helper function to make GraphQL calls
  async graphqlCall(query, variables = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      const token = Auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL call error:', error);
      throw error;
    }
  },

  // Save a recipe to storage
  async saveRecipe(recipe) {
    try {
      const mutation = `
        mutation CreateRecipe($input: RecipeInput!) {
          createRecipe(input: $input) {
            success
            id
            recipe {
              id
              title
              description
              ingredients
              instructions
              prepTime
              cookTime
              totalTime
              servings
              category
              cuisine
              image
              author
              url
              source
              dateAdded
              dateModified
            }
            error
          }
        }
      `;

      const data = await this.graphqlCall(mutation, { input: recipe });
      return data.createRecipe;
    } catch (error) {
      console.error('Error saving recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all recipes
  async getAllRecipes() {
    try {
      const query = `
        query GetAllRecipes {
          recipes {
            id
            title
            description
            ingredients
            instructions
            prepTime
            cookTime
            totalTime
            servings
            category
            cuisine
            image
            author
            url
            source
            dateAdded
            dateModified
          }
        }
      `;

      const data = await this.graphqlCall(query);
      return data.recipes || [];
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  },

  // Get a single recipe by ID
  async getRecipe(id) {
    try {
      const query = `
        query GetRecipe($id: ID!) {
          recipe(id: $id) {
            id
            title
            description
            ingredients
            instructions
            prepTime
            cookTime
            totalTime
            servings
            category
            cuisine
            image
            author
            url
            source
            dateAdded
            dateModified
          }
        }
      `;

      const data = await this.graphqlCall(query, { id });
      return data.recipe;
    } catch (error) {
      console.error('Error getting recipe:', error);
      return null;
    }
  },

  // Delete a recipe by ID
  async deleteRecipe(id) {
    try {
      const mutation = `
        mutation DeleteRecipe($id: ID!) {
          deleteRecipe(id: $id) {
            success
            error
          }
        }
      `;

      const data = await this.graphqlCall(mutation, { id });
      return data.deleteRecipe;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a recipe
  async updateRecipe(id, updatedRecipe) {
    try {
      const mutation = `
        mutation UpdateRecipe($id: ID!, $input: RecipeUpdateInput!) {
          updateRecipe(id: $id, input: $input) {
            success
            recipe {
              id
              title
              description
              ingredients
              instructions
              prepTime
              cookTime
              totalTime
              servings
              category
              cuisine
              image
              author
              url
              source
              dateAdded
              dateModified
            }
            error
          }
        }
      `;

      const data = await this.graphqlCall(mutation, { id, input: updatedRecipe });
      return data.updateRecipe;
    } catch (error) {
      console.error('Error updating recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Search recipes
  async searchRecipes(query) {
    try {
      const graphqlQuery = `
        query SearchRecipes($query: String!) {
          searchRecipes(query: $query) {
            id
            title
            description
            ingredients
            instructions
            prepTime
            cookTime
            totalTime
            servings
            category
            cuisine
            image
            author
            url
            source
            dateAdded
            dateModified
          }
        }
      `;

      const data = await this.graphqlCall(graphqlQuery, { query });
      return data.searchRecipes || [];
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  },

  // Export all recipes as JSON
  async exportRecipes() {
    try {
      const recipes = await this.getAllRecipes();
      return JSON.stringify(recipes, null, 2);
    } catch (error) {
      console.error('Error exporting recipes:', error);
      return null;
    }
  },

  // Import recipes from JSON
  async importRecipes(jsonString) {
    try {
      const recipes = JSON.parse(jsonString);

      const mutation = `
        mutation ImportRecipes($recipes: [RecipeInput!]!) {
          importRecipes(recipes: $recipes) {
            success
            imported
            error
          }
        }
      `;

      const data = await this.graphqlCall(mutation, { recipes });
      return data.importRecipes;
    } catch (error) {
      console.error('Error importing recipes:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate a unique ID
  async generateId() {
    try {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    } catch (error) {
      console.error('Error generating ID:', error);
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  },

  // Get storage statistics
  async getStats() {
    try {
      const query = `
        query GetStats {
          stats {
            totalRecipes
            categories
            cuisines
          }
        }
      `;

      const data = await this.graphqlCall(query);
      return data.stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
};
