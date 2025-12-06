# Recipe Collection - GitHub Pages

This is a static website that displays all recipes from the Recipe Saver API.

## Features

- **Live Recipe Display**: Fetches recipes in real-time from the GraphQL API
- **Search**: Search recipes by title, ingredients, or category
- **Filters**: Filter by category and cuisine
- **Statistics**: Shows total recipes, categories, and cuisines
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Recipe Cards**: Beautiful card-based layout with images and metadata

## How It Works

The website uses vanilla JavaScript to fetch data from the Cloudflare Workers GraphQL API:

```javascript
fetch('https://recipe-saver-api.hamiltoon.workers.dev/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ recipes { ... } }' })
})
```

## Files

- `index.html` - Main HTML structure
- `style.css` - Responsive CSS styling
- `script.js` - GraphQL API integration and filtering logic

## Deployment

This site is deployed via GitHub Pages from the `/docs` directory.

To enable GitHub Pages:
1. Go to repository Settings
2. Navigate to Pages section
3. Set Source to "Deploy from a branch"
4. Select branch: `main`
5. Select folder: `/docs`
6. Click Save

The site will be available at: `https://hamiltoon.github.io/animated-winner/`

## Local Development

To test locally, simply open `index.html` in a web browser. No build process required since it's a static site using vanilla JavaScript.

Alternatively, use a local server:

```bash
cd docs
python3 -m http.server 8000
# Visit http://localhost:8000
```

## API Integration

The site connects to the Recipe Saver GraphQL API deployed on Cloudflare Workers. No authentication is required as the API is configured to allow public read access.

API Endpoint: `https://recipe-saver-api.hamiltoon.workers.dev/graphql`
