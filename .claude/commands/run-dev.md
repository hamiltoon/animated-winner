---
description: Start local development servers for web and API
---

Start the local development environment.

Run these commands in separate terminals:

1. **Web App** (port 5173):
   ```bash
   cd web
   npm run dev
   ```

2. **API** (port 8787):
   ```bash
   cd api
   npx wrangler dev
   ```

The web app will be at http://localhost:5173 and API at http://localhost:8787
