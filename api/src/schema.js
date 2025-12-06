// GraphQL Schema (inlined for Cloudflare Workers compatibility)
import { createSchema as makeExecutableSchema } from 'graphql-yoga';

// GraphQL type definitions (inlined to avoid fs dependency)
const typeDefs = `#graphql
  type User {
    id: ID!
    githubId: String!
    username: String!
    email: String
    avatarUrl: String
    name: String
    createdAt: String!
    lastLogin: String!
  }

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
    userId: String
    user: User
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

  type AuthResponse {
    success: Boolean!
    token: String
    user: User
    error: String
  }

  type Query {
    recipes: [Recipe!]!
    recipe(id: ID!): Recipe
    searchRecipes(query: String!): [Recipe!]!
    stats: Stats!
    me: User
    health: String!
  }

  type Mutation {
    authenticateGitHub(code: String!): AuthResponse!
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
