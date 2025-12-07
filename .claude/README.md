# Claude Code Configuration

This directory contains configuration files for Claude Code, an AI-powered coding assistant.

## Files

- `settings.json` - Project-specific settings for Claude Code
- `commands/` - Custom slash commands for common tasks
- `prompts/` - Reusable prompt templates

## Custom Commands

Use slash commands to quickly perform common tasks:

- `/deploy-web` - Deploy the web app to GitHub Pages
- `/deploy-api` - Deploy the API to Cloudflare Workers
- `/run-dev` - Start local development servers
- `/test-api` - Test the GraphQL API
- `/add-recipe` - Create a new recipe via GraphQL

## Project Context

This is a full-stack recipe management application with:

- React web app (web/)
- Cloudflare Workers GraphQL API (api/)
- Chrome extension (plugin/)
- GitHub Pages deployment
- GitHub OAuth authentication

When working on this project:
1. The web app uses Vite and React with a black and white theme
2. The API uses GraphQL Yoga and Cloudflare D1 database
3. All API queries require Bearer token authentication
4. The app is deployed at https://hamiltoon.github.io/animated-winner/
