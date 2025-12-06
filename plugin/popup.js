// Popup script for Recipe Saver extension

let currentRecipeId = null;

// DOM elements
const authView = document.getElementById("authView");
const mainView = document.getElementById("mainView");
const recipeView = document.getElementById("recipeView");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userName = document.getElementById("userName");
const authStatus = document.getElementById("authStatus");
const extractBtn = document.getElementById("extractRecipe");
const statusDiv = document.getElementById("status");
const recipeList = document.getElementById("recipeList");
const recipeCount = document.getElementById("recipeCount");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const backBtn = document.getElementById("backBtn");
const recipeDetails = document.getElementById("recipeDetails");
const deleteRecipeBtn = document.getElementById("deleteRecipeBtn");

// Initialize popup
document.addEventListener("DOMContentLoaded", async function () {
  await initializeAuth();
  setupEventListeners();
});

// Initialize authentication
async function initializeAuth() {
  if (Auth.isAuthenticated()) {
    try {
      const user = await Auth.getCurrentUser();
      if (user) {
        showMainView(user);
      } else {
        showAuthView();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      showAuthView();
    }
  } else {
    showAuthView();
  }
}

function showAuthView() {
  authView.classList.remove('hidden');
  mainView.classList.add('hidden');
  recipeView.classList.add('hidden');
}

function showMainView(user) {
  authView.classList.add('hidden');
  mainView.classList.remove('hidden');
  recipeView.classList.add('hidden');
  userName.textContent = user.username;
  loadRecipes();
}

function setupEventListeners() {
  signInBtn.addEventListener("click", handleSignIn);
  signOutBtn.addEventListener("click", handleSignOut);
  extractBtn.addEventListener("click", extractRecipeFromPage);
  searchInput.addEventListener("input", handleSearch);
  exportBtn.addEventListener("click", exportRecipes);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importRecipes);
  backBtn.addEventListener("click", () => showView("main"));
  deleteRecipeBtn.addEventListener("click", deleteCurrentRecipe);
}

async function handleSignIn() {
  try {
    authStatus.textContent = 'Signing in...';
    authStatus.className = 'status info';
    signInBtn.disabled = true;

    const user = await Auth.login();
    showMainView(user);
  } catch (error) {
    console.error('Sign in error:', error);
    authStatus.textContent = `Error: ${error.message}`;
    authStatus.className = 'status error';
    signInBtn.disabled = false;
  }
}

function handleSignOut() {
  Auth.logout();
  showAuthView();
}

// Extract recipe from current page
async function extractRecipeFromPage() {
  try {
    setStatus("Extracting recipe...", "info");
    extractBtn.disabled = true;

    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Inject content script if needed
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch (e) {
      // Content script might already be injected, that's okay
      console.log("Content script already injected or error:", e);
    }

    // Wait a bit for the script to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extractRecipe",
    });

    if (response && response.recipe) {
      // Save the recipe
      const result = await RecipeStorage.saveRecipe(response.recipe);

      if (result.success) {
        setStatus("Recipe saved successfully!", "success");
        await loadRecipes();

        // Show the saved recipe
        setTimeout(() => {
          showRecipe(result.id);
        }, 1000);
      } else {
        setStatus("Error saving recipe: " + result.error, "error");
      }
    } else {
      setStatus("No recipe found on this page", "error");
    }
  } catch (error) {
    console.error("Error extracting recipe:", error);
    setStatus("Error: " + error.message, "error");
  } finally {
    extractBtn.disabled = false;
  }
}

// Load and display all recipes
async function loadRecipes(recipes = null) {
  if (!recipes) {
    recipes = await RecipeStorage.getAllRecipes();
  }

  recipeCount.textContent = recipes.length;

  if (recipes.length === 0) {
    recipeList.innerHTML =
      '<div class="empty-state">No recipes saved yet.<br>Visit a recipe page and click "Save Recipe"!</div>';
    return;
  }

  // Sort by date added (newest first)
  recipes.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  recipeList.innerHTML = recipes
    .map(
      (recipe) => `
    <div class="recipe-item" data-id="${recipe.id}">
      <div class="recipe-item-title">${escapeHtml(recipe.title)}</div>
      <div class="recipe-item-meta">
        ${recipe.source ? `From ${escapeHtml(recipe.source)}` : ""}
        ${recipe.category ? ` • ${escapeHtml(recipe.category)}` : ""}
      </div>
    </div>
  `
    )
    .join("");

  // Add click handlers to recipe items
  document.querySelectorAll(".recipe-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.dataset.id;
      showRecipe(id);
    });
  });
}

// Show recipe details
async function showRecipe(id) {
  const recipe = await RecipeStorage.getRecipe(id);
  if (!recipe) {
    setStatus("Recipe not found", "error");
    return;
  }

  currentRecipeId = id;

  let html = `
    <div class="recipe-title">${escapeHtml(recipe.title)}</div>
    <div class="recipe-meta">
      ${recipe.source ? `Source: ${escapeHtml(recipe.source)}<br>` : ""}
      ${recipe.author ? `By ${escapeHtml(recipe.author)}<br>` : ""}
      ${recipe.category ? `Category: ${escapeHtml(recipe.category)}<br>` : ""}
      ${recipe.cuisine ? `Cuisine: ${escapeHtml(recipe.cuisine)}<br>` : ""}
      ${recipe.prepTime ? `Prep: ${escapeHtml(recipe.prepTime)} • ` : ""}
      ${recipe.cookTime ? `Cook: ${escapeHtml(recipe.cookTime)} • ` : ""}
      ${recipe.servings ? `Servings: ${escapeHtml(recipe.servings)}` : ""}
    </div>
  `;

  if (recipe.description) {
    html += `
      <div class="recipe-section">
        <h3>Description</h3>
        <p>${escapeHtml(recipe.description)}</p>
      </div>
    `;
  }

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    html += `
      <div class="recipe-section">
        <h3>Ingredients</h3>
        <ul>
          ${recipe.ingredients
            .map((ing) => `<li>${escapeHtml(ing)}</li>`)
            .join("")}
        </ul>
      </div>
    `;
  }

  if (recipe.instructions && recipe.instructions.length > 0) {
    html += `
      <div class="recipe-section">
        <h3>Instructions</h3>
        <ol>
          ${recipe.instructions
            .map((inst) => `<li>${escapeHtml(inst)}</li>`)
            .join("")}
        </ol>
      </div>
    `;
  }

  if (recipe.url) {
    html += `
      <div class="recipe-section">
        <a href="${escapeHtml(
          recipe.url
        )}" target="_blank" style="color: #1a73e8;">View Original Recipe</a>
      </div>
    `;
  }

  recipeDetails.innerHTML = html;
  showView("recipe");
}

// Delete current recipe
async function deleteCurrentRecipe() {
  if (!currentRecipeId) return;

  if (confirm("Are you sure you want to delete this recipe?")) {
    const result = await RecipeStorage.deleteRecipe(currentRecipeId);
    if (result.success) {
      showView("main");
      await loadRecipes();
      setStatus("Recipe deleted", "info");
    } else {
      setStatus("Error deleting recipe", "error");
    }
  }
}

// Handle search
async function handleSearch() {
  const query = searchInput.value.trim();

  if (query === "") {
    await loadRecipes();
    return;
  }

  const results = await RecipeStorage.searchRecipes(query);
  await loadRecipes(results);
}

// Export recipes
async function exportRecipes() {
  try {
    const jsonString = await RecipeStorage.exportRecipes();
    if (!jsonString) {
      setStatus("No recipes to export", "error");
      return;
    }

    // Create download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recipes-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus("Recipes exported successfully!", "success");
  } catch (error) {
    setStatus("Error exporting recipes", "error");
  }
}

// Import recipes
async function importRecipes(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const result = await RecipeStorage.importRecipes(text);

    if (result.success) {
      setStatus(`Imported ${result.imported} new recipes!`, "success");
      await loadRecipes();
    } else {
      setStatus("Error importing recipes: " + result.error, "error");
    }
  } catch (error) {
    setStatus("Error reading file", "error");
  }

  // Reset file input
  importFile.value = "";
}

// Show/hide views
function showView(view) {
  if (view === "main") {
    mainView.classList.remove("hidden");
    recipeView.classList.add("hidden");
    currentRecipeId = null;
  } else if (view === "recipe") {
    mainView.classList.add("hidden");
    recipeView.classList.remove("hidden");
  }
}

// Set status message
function setStatus(message, type = "") {
  statusDiv.textContent = message;
  statusDiv.className = "status " + type;

  if (message) {
    setTimeout(() => {
      statusDiv.textContent = "";
      statusDiv.className = "status";
    }, 3000);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
