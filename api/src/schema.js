// GraphQL Schema (inlined for Cloudflare Workers compatibility)
import { createSchema as makeExecutableSchema } from 'graphql-yoga';

// GraphQL type definitions (inlined to avoid fs dependency)
const typeDefs = `#graphql
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

  input RecipeInput {
    id: ID
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
    dateAdded: String
  }

  input RecipeUpdateInput {
    title: String
    description: String
    ingredients: [String!]
    instructions: [String!]
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
  }

  type RecipeResponse {
    success: Boolean!
    id: ID
    recipe: Recipe
    error: String
  }

  type ImportResponse {
    success: Boolean!
    imported: Int!
    error: String
  }

  type Stats {
    totalRecipes: Int!
    categories: [String!]!
    cuisines: [String!]!
  }

  type Query {
    recipes: [Recipe!]!
    recipe(id: ID!): Recipe
    searchRecipes(query: String!): [Recipe!]!
    stats: Stats!
    health: String!
  }

  type Mutation {
    createRecipe(input: RecipeInput!): RecipeResponse!
    updateRecipe(id: ID!, input: RecipeUpdateInput!): RecipeResponse!
    deleteRecipe(id: ID!): RecipeResponse!
    importRecipes(recipes: [RecipeInput!]!): ImportResponse!
  }
`;

export function createSchema(resolvers) {
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
}
