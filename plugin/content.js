// Content script to extract recipe data from web pages
// This script looks for recipe data using schema.org JSON-LD and common HTML patterns

function extractRecipe() {
  let recipe = null;

  // Method 1: Look for JSON-LD schema.org Recipe markup
  const jsonLdScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const recipes = [];

      // Handle both single objects and arrays
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (
          item["@type"] === "Recipe" ||
          (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
        ) {
          recipes.push(item);
        }
        // Check if there's a @graph property
        if (item["@graph"]) {
          for (const graphItem of item["@graph"]) {
            if (
              graphItem["@type"] === "Recipe" ||
              (Array.isArray(graphItem["@type"]) &&
                graphItem["@type"].includes("Recipe"))
            ) {
              recipes.push(graphItem);
            }
          }
        }
      }

      if (recipes.length > 0) {
        recipe = normalizeRecipe(recipes[0]);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  // Method 2: Fall back to searching for common recipe HTML patterns
  if (!recipe) {
    recipe = extractRecipeFromHTML();
  }

  return recipe;
}

function normalizeRecipe(schemaRecipe) {
  const normalized = {
    title: schemaRecipe.name || "",
    description: schemaRecipe.description || "",
    ingredients: [],
    instructions: [],
    prepTime: schemaRecipe.prepTime || "",
    cookTime: schemaRecipe.cookTime || "",
    totalTime: schemaRecipe.totalTime || "",
    servings: schemaRecipe.recipeYield || "",
    category: schemaRecipe.recipeCategory || "",
    cuisine: schemaRecipe.recipeCuisine || "",
    image: schemaRecipe.image?.url || schemaRecipe.image || "",
    author: schemaRecipe.author?.name || schemaRecipe.author || "",
    url: window.location.href,
    source: window.location.hostname,
    dateAdded: new Date().toISOString(),
  };

  // Extract ingredients
  if (schemaRecipe.recipeIngredient) {
    normalized.ingredients = Array.isArray(schemaRecipe.recipeIngredient)
      ? schemaRecipe.recipeIngredient
      : [schemaRecipe.recipeIngredient];
  }

  // Extract instructions
  if (schemaRecipe.recipeInstructions) {
    if (Array.isArray(schemaRecipe.recipeInstructions)) {
      normalized.instructions = schemaRecipe.recipeInstructions
        .map((instruction) => {
          if (typeof instruction === "string") return instruction;
          if (instruction.text) return instruction.text;
          if (instruction.name) return instruction.name;
          return "";
        })
        .filter((i) => i);
    } else if (typeof schemaRecipe.recipeInstructions === "string") {
      normalized.instructions = [schemaRecipe.recipeInstructions];
    }
  }

  return normalized;
}

function extractRecipeFromHTML() {
  // Try to extract recipe from common HTML patterns
  const title =
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector(".recipe-title")?.textContent?.trim() ||
    document.title;

  const ingredients = [];
  const ingredientSelectors = [
    ".ingredient",
    ".recipe-ingredient",
    '[itemprop="recipeIngredient"]',
    "li.ingredient-item",
  ];

  for (const selector of ingredientSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach((el) => {
        const text = el.textContent.trim();
        if (text) ingredients.push(text);
      });
      break;
    }
  }

  const instructions = [];
  const instructionSelectors = [
    ".instruction",
    ".recipe-instruction",
    '[itemprop="recipeInstructions"]',
    ".step",
  ];

  for (const selector of instructionSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach((el) => {
        const text = el.textContent.trim();
        if (text) instructions.push(text);
      });
      break;
    }
  }

  // Only return a recipe if we found at least a title and some ingredients
  if (title && ingredients.length > 0) {
    return {
      title: title,
      description: "",
      ingredients: ingredients,
      instructions: instructions,
      prepTime: "",
      cookTime: "",
      totalTime: "",
      servings: "",
      category: "",
      cuisine: "",
      image: "",
      author: "",
      url: window.location.href,
      source: window.location.hostname,
      dateAdded: new Date().toISOString(),
    };
  }

  return null;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractRecipe") {
    const recipe = extractRecipe();
    sendResponse({ recipe: recipe });
  }
  return true;
});
