import './RecipeCard.css';

export function RecipeCard({ recipe, index }) {
  const handleClick = () => {
    if (recipe.url) {
      window.open(recipe.url, '_blank');
    }
  };

  const hasImage = recipe.image && recipe.image !== 'null';

  return (
    <div
      className="recipe-card"
      onClick={handleClick}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {hasImage ? (
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-image"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="recipe-image"></div>
      )}

      <div className="recipe-content">
        <h3 className="recipe-title">{recipe.title}</h3>

        {recipe.description && recipe.description !== 'null' && (
          <p className="recipe-description">{recipe.description}</p>
        )}

        <div className="recipe-meta">
          {recipe.category && recipe.category !== 'null' && (
            <span className="recipe-badge category">{recipe.category}</span>
          )}
          {recipe.cuisine && recipe.cuisine !== 'null' && (
            <span className="recipe-badge cuisine">{recipe.cuisine}</span>
          )}
          {recipe.servings && recipe.servings !== 'null' && (
            <span className="recipe-badge">{recipe.servings} servings</span>
          )}
        </div>

        {(recipe.prepTime || recipe.cookTime || recipe.totalTime) && (
          <div className="recipe-times">
            {recipe.prepTime && recipe.prepTime !== 'null' && (
              <div className="time-item">⏱️ Prep: {recipe.prepTime}</div>
            )}
            {recipe.cookTime && recipe.cookTime !== 'null' && (
              <div className="time-item">🔥 Cook: {recipe.cookTime}</div>
            )}
            {recipe.totalTime && recipe.totalTime !== 'null' && !recipe.prepTime && !recipe.cookTime && (
              <div className="time-item">⏱️ Total: {recipe.totalTime}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
