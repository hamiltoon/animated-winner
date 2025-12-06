# Recipe Saver Chrome Extension

Chrome extension for extracting and saving recipes from web pages.

## Features

- Extract recipes from web pages using schema.org markup
- Automatic fallback to HTML pattern matching
- Save recipes to backend via GraphQL API
- View all saved recipes
- Search recipes by title, ingredients, category, cuisine
- Export/Import recipes as JSON
- Delete recipes

## Installation

1. Make sure the API server is running (see [../api/README.md](../api/README.md))
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select this `plugin` directory
6. The extension should now appear in your extensions list

## Usage

### Saving a Recipe

1. Navigate to any recipe website (e.g., allrecipes.com, foodnetwork.com, bbcgoodfood.com)
2. Click the Recipe Saver extension icon in your Chrome toolbar
3. Click "Save Recipe from Page"
4. The recipe will be extracted and saved to the database

### Viewing Recipes

1. Click the Recipe Saver extension icon
2. Your saved recipes will be displayed in the popup
3. Click on any recipe to view full details

### Searching Recipes

1. Enter a search term in the search box
2. Recipes matching the title, ingredients, category, or cuisine will be shown

### Exporting/Importing

- **Export**: Click "Export All Recipes" to download a JSON file
- **Import**: Click "Import Recipes" and select a JSON file

## How Recipe Extraction Works

The extension uses two methods to extract recipes:

### 1. Schema.org JSON-LD (Primary)

Most recipe websites use [schema.org Recipe](https://schema.org/Recipe) markup with JSON-LD. The extension looks for `<script type="application/ld+json">` tags and extracts recipe data from them.

### 2. HTML Pattern Matching (Fallback)

If no schema.org markup is found, the extension falls back to searching for common HTML patterns:
- Recipe titles in headings or elements with "recipe" class/id
- Ingredient lists in `<ul>` or `<ol>` elements
- Instruction steps in ordered lists or numbered paragraphs

## Files

- **manifest.json**: Extension configuration
- **popup.html**: Extension popup UI
- **popup.css**: Styling for the popup
- **popup.js**: Popup logic and event handlers
- **content.js**: Content script for recipe extraction
- **storage.js**: GraphQL API client

## API Connection

The extension connects to the GraphQL API at `http://localhost:4000/graphql`. This is configured in [storage.js](storage.js:4).

To change the API endpoint, update the `GRAPHQL_URL` constant in [storage.js](storage.js).

## Permissions

The extension requires:
- `activeTab`: To access the current page for recipe extraction
- `scripting`: To inject the content script
- `http://localhost:4000/*`: To communicate with the API server

## Debugging

- Open Chrome DevTools on the extension popup (right-click > Inspect)
- Check the Console tab for errors
- Check `chrome://extensions/` for extension-level errors
- Ensure the API server is running and accessible

## Notes

- The API server must be running for the extension to work
- Recipes are deduplicated by URL when importing
- All fields support Unicode for international recipes
