const API_URL = 'https://recipe-saver-api.hamiltoon.workers.dev/graphql';

let allRecipes = [];
let filteredRecipes = [];

async function fetchGraphQL(query, variables = {}) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(result.errors[0].message);
    }

    return result.data;
}

async function loadRecipes() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const recipesContainer = document.getElementById('recipes');
    const emptyState = document.getElementById('emptyState');

    try {
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

        const data = await fetchGraphQL(query);

        allRecipes = data.recipes || [];
        filteredRecipes = [...allRecipes];

        updateStats(data.stats);
        updateFilters(data.stats);
        displayRecipes(filteredRecipes);

        loading.style.display = 'none';

        if (filteredRecipes.length === 0) {
            emptyState.style.display = 'block';
        }
    } catch (err) {
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

document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();

    document.getElementById('searchInput').addEventListener('input', filterRecipes);
    document.getElementById('categoryFilter').addEventListener('change', filterRecipes);
    document.getElementById('cuisineFilter').addEventListener('change', filterRecipes);
});
