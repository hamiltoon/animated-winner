// API_URL is defined in auth.js
let allRecipes = [];
let filteredRecipes = [];

async function fetchGraphQL(query, variables = {}) {
    console.log('[DEBUG] fetchGraphQL: Making request to', API_URL);
    console.log('[DEBUG] fetchGraphQL: Query:', query.substring(0, 100) + '...');

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    });

    console.log('[DEBUG] fetchGraphQL: Response status:', response.status);

    const result = await response.json();
    console.log('[DEBUG] fetchGraphQL: Response data:', result);

    if (result.errors) {
        console.error('[ERROR] fetchGraphQL: GraphQL errors:', result.errors);
        throw new Error(result.errors[0].message);
    }

    return result.data;
}

async function loadRecipes() {
    console.log('[DEBUG] loadRecipes: Starting');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const recipesContainer = document.getElementById('recipes');
    const emptyState = document.getElementById('emptyState');

    console.log('[DEBUG] loadRecipes: DOM elements found:', {
        loading: !!loading,
        error: !!error,
        recipesContainer: !!recipesContainer,
        emptyState: !!emptyState
    });

    try {
        console.log('[DEBUG] loadRecipes: Showing loading spinner');
        loading.style.display = 'block';
        error.style.display = 'none';
        emptyState.style.display = 'none';

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

        console.log('[DEBUG] loadRecipes: Calling fetchGraphQL');
        const data = await fetchGraphQL(query);
        console.log('[DEBUG] loadRecipes: Received data:', data);

        allRecipes = data.recipes || [];
        filteredRecipes = [...allRecipes];
        console.log('[DEBUG] loadRecipes: Processed recipes count:', allRecipes.length);

        updateStats(data.stats);
        updateFilters(data.stats);
        displayRecipes(filteredRecipes);

        console.log('[DEBUG] loadRecipes: Hiding loading spinner');
        loading.style.display = 'none';

        if (filteredRecipes.length === 0) {
            emptyState.style.display = 'block';
        }
        console.log('[DEBUG] loadRecipes: Complete');
    } catch (err) {
        console.error('[ERROR] loadRecipes: Error occurred:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = `Error loading recipes: ${err.message}`;
    }
}

function updateStats(stats) {
    if (!stats) return;

    document.getElementById('totalRecipes').textContent = stats.totalRecipes || 0;
    document.getElementById('totalCategories').textContent = stats.categories?.length || 0;
    document.getElementById('totalCuisines').textContent = stats.cuisines?.length || 0;
}

function updateFilters(stats) {
    if (!stats) return;

    const categoryFilter = document.getElementById('categoryFilter');
    const cuisineFilter = document.getElementById('cuisineFilter');

    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    stats.categories?.forEach(category => {
        if (category) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });

    cuisineFilter.innerHTML = '<option value="">All Cuisines</option>';
    stats.cuisines?.forEach(cuisine => {
        if (cuisine) {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        }
    });
}

function displayRecipes(recipes) {
    const recipesContainer = document.getElementById('recipes');
    const emptyState = document.getElementById('emptyState');

    recipesContainer.innerHTML = '';

    if (recipes.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    recipes.forEach(recipe => {
        const card = createRecipeCard(recipe);
        recipesContainer.appendChild(card);
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    if (recipe.url) {
        card.onclick = () => window.open(recipe.url, '_blank');
    }

    const hasImage = recipe.image && recipe.image !== 'null';
    const imageHTML = hasImage
        ? `<img src="${recipe.image}" alt="${recipe.title}" class="recipe-image" onerror="this.style.display='none'">`
        : '<div class="recipe-image"></div>';

    const description = recipe.description && recipe.description !== 'null'
        ? `<p class="recipe-description">${recipe.description}</p>`
        : '';

    const category = recipe.category && recipe.category !== 'null'
        ? `<span class="recipe-badge category">${recipe.category}</span>`
        : '';

    const cuisine = recipe.cuisine && recipe.cuisine !== 'null'
        ? `<span class="recipe-badge cuisine">${recipe.cuisine}</span>`
        : '';

    const servings = recipe.servings && recipe.servings !== 'null'
        ? `<span class="recipe-badge">${recipe.servings} servings</span>`
        : '';

    const times = [];
    if (recipe.prepTime && recipe.prepTime !== 'null') {
        times.push(`<div class="time-item">⏱️ Prep: ${recipe.prepTime}</div>`);
    }
    if (recipe.cookTime && recipe.cookTime !== 'null') {
        times.push(`<div class="time-item">🔥 Cook: ${recipe.cookTime}</div>`);
    }
    if (recipe.totalTime && recipe.totalTime !== 'null' && times.length === 0) {
        times.push(`<div class="time-item">⏱️ Total: ${recipe.totalTime}</div>`);
    }

    const timesHTML = times.length > 0
        ? `<div class="recipe-times">${times.join('')}</div>`
        : '';

    card.innerHTML = `
        ${imageHTML}
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
            ${description}
            <div class="recipe-meta">
                ${category}
                ${cuisine}
                ${servings}
            </div>
            ${timesHTML}
        </div>
    `;

    return card;
}

function filterRecipes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const cuisineFilter = document.getElementById('cuisineFilter').value;

    filteredRecipes = allRecipes.filter(recipe => {
        const matchesSearch = !searchTerm ||
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.description?.toLowerCase().includes(searchTerm) ||
            recipe.ingredients?.some(ing => ing.toLowerCase().includes(searchTerm)) ||
            recipe.category?.toLowerCase().includes(searchTerm) ||
            recipe.cuisine?.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
        const matchesCuisine = !cuisineFilter || recipe.cuisine === cuisineFilter;

        return matchesSearch && matchesCategory && matchesCuisine;
    });

    displayRecipes(filteredRecipes);
}

// Initialize auth UI
async function initializeAuth() {
    console.log('[DEBUG] initializeAuth: Starting');
    const signInButton = document.getElementById('signInButton');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    console.log('[DEBUG] initializeAuth: DOM elements found:', {
        signInButton: !!signInButton,
        userProfile: !!userProfile,
        userAvatar: !!userAvatar,
        userName: !!userName
    });

    console.log('[DEBUG] initializeAuth: Checking if authenticated');
    if (auth.isAuthenticated()) {
        console.log('[DEBUG] initializeAuth: User is authenticated, fetching current user');
        try {
            const user = await auth.getCurrentUser();
            console.log('[DEBUG] initializeAuth: Got user:', user);
            if (user) {
                // Show user profile, hide sign in button
                signInButton.style.display = 'none';
                userProfile.style.display = 'flex';
                userAvatar.src = user.avatarUrl;
                userName.textContent = user.username;
                console.log('[DEBUG] initializeAuth: User profile displayed');
            } else {
                // Invalid token, show sign in button
                signInButton.style.display = 'flex';
                userProfile.style.display = 'none';
                console.log('[DEBUG] initializeAuth: Invalid token, showing sign in button');
            }
        } catch (error) {
            console.error('[ERROR] initializeAuth: Error loading user:', error);
            signInButton.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    } else {
        // Not authenticated, show sign in button
        console.log('[DEBUG] initializeAuth: Not authenticated, showing sign in button');
        signInButton.style.display = 'flex';
        userProfile.style.display = 'none';
    }
    console.log('[DEBUG] initializeAuth: Complete');
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[DEBUG] DOMContentLoaded event fired');

    try {
        console.log('[DEBUG] Starting initializeAuth');
        await initializeAuth();
        console.log('[DEBUG] initializeAuth completed');
    } catch (error) {
        console.error('[ERROR] initializeAuth failed:', error);
    }

    try {
        console.log('[DEBUG] Starting loadRecipes');
        await loadRecipes();
        console.log('[DEBUG] loadRecipes completed');
    } catch (error) {
        console.error('[ERROR] loadRecipes failed:', error);
    }

    document.getElementById('searchInput').addEventListener('input', filterRecipes);
    document.getElementById('categoryFilter').addEventListener('change', filterRecipes);
    document.getElementById('cuisineFilter').addEventListener('change', filterRecipes);

    console.log('[DEBUG] All initialization complete');
});
