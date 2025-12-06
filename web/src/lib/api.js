import { API_URL } from './auth';
import { auth } from './auth';

export async function fetchGraphQL(query, variables = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

export async function loadRecipes() {
  const query = `
    query {
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
      }
      stats {
        totalRecipes
        categories
        cuisines
      }
    }
  `;

  return await fetchGraphQL(query);
}
