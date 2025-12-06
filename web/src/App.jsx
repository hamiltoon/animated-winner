import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RecipeCard } from './components/RecipeCard';
import { auth } from './lib/auth';
import { loadRecipes } from './lib/api';
import * as Select from '@radix-ui/react-select';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');

  useEffect(() => {
    initializeAuth();
    handleOAuthCallback();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRecipes();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    filterRecipes();
  }, [searchTerm, categoryFilter, cuisineFilter, recipes]);

  async function initializeAuth() {
    if (auth.isAuthenticated()) {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
  }

  async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state) {
      try {
        const user = await auth.handleCallback(code, state);
        setUser(user);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        setError(error.message);
      }
    }
  }

  async function fetchRecipes() {
    try {
      setLoading(true);
      setError(null);
      const data = await loadRecipes();
      setRecipes(data.recipes || []);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function filterRecipes() {
    let filtered = recipes.filter(recipe => {
      const matchesSearch = !searchTerm ||
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients?.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())) ||
        recipe.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.cuisine?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
      const matchesCuisine = !cuisineFilter || recipe.cuisine === cuisineFilter;

      return matchesSearch && matchesCategory && matchesCuisine;
    });

    setFilteredRecipes(filtered);
  }

  function handleSignOut() {
    auth.logout();
    setUser(null);
    setRecipes([]);
    setFilteredRecipes([]);
    setStats(null);
  }

  if (loading) {
    return (
      <div>
        <Header user={user} onSignOut={handleSignOut} />
        <main className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading recipes...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header user={user} onSignOut={handleSignOut} />

      <main className="container">
        {error && (
          <div className="error">
            Error: {error}
          </div>
        )}

        {user ? (
          <>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">{stats?.totalRecipes || 0}</span>
                <span className="stat-label">Recipes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats?.categories?.length || 0}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats?.cuisines?.length || 0}</span>
                <span className="stat-label">Cuisines</span>
              </div>
            </div>

            <div className="search-container">
              <input
                type="text"
                id="searchInput"
                placeholder="Search recipes by title, ingredients, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filters">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {stats?.categories?.filter(c => c).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
              >
                <option value="">All Cuisines</option>
                {stats?.cuisines?.filter(c => c).map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>

            {filteredRecipes.length > 0 ? (
              <div className="recipe-grid">
                {filteredRecipes.map((recipe, index) => (
                  <RecipeCard key={recipe.id} recipe={recipe} index={index} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h2>No recipes found</h2>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h2>Sign in to view recipes</h2>
            <p>Please sign in with GitHub to access your recipe collection</p>
          </div>
        )}
      </main>

      <footer>
        <div className="container">
          <p>
            Powered by{' '}
            <a href="https://recipe-saver-api.hamiltoon.workers.dev/graphql" target="_blank" rel="noopener noreferrer">
              Recipe Saver API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
