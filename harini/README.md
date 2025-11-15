ClerkRole module — quick start

This folder contains a lightweight clerk role UI + development server so you can run and test the clerk pages without wiring a real MySQL database.

What is included
- backend/
  - clerkRoutes.js — Express router for clerk actions (used in real-DB mode)
  - clerkController.js — controller that implements SQL-backed handlers (used when USE_REAL_DB=true)
- frontend/
  - clerk-menu.css / clerk-menu.js — shared sidebar UI (injected into pages)
  - clerk.css — page styles
  - books.html, reports.html, policy.html, users.html — clerk pages
- server_clerk.js — a small development server that serves the frontend, seeds realistic mock data, and exposes mock endpoints so you can try the UI without a DB.

Prerequisites
- Node.js 14+ (tested with Node 16+)
- npm installed (or use yarn)

How to run the ClerkRole dev server (mock mode — recommended for quick testing)

1. Open PowerShell in the repository root (where `package.json` lives).
2. Install dependencies (if not already installed):

```powershell
npm install
```

3. Start the ClerkRole dev server (this serves the pages from `ClerkRole/frontend` on port 6001 by default):

```powershell
node ClerkRole/server_clerk.js
```

4. Open the pages in your browser:

- Books: http://localhost:6001/books.html
- Reports: http://localhost:6001/reports.html
- Policy: http://localhost:6001/policy.html
- Users: http://localhost:6001/users.html

Notes about mock mode
- By default the dev server runs with in-memory mock data (books, users, borrow records, fines). This lets you exercise the UI fully without a database.
- The mock seed includes ~40 realistic books and ~20 users. Changes you make via the UI (add/delete) are in-memory only — they reset after you restart the server.

Enabling a real MySQL database (optional)

If you want the clerk controllers to use a real MySQL database, set environment variables and start the main server (or start the clerk server with USE_REAL_DB=true).

1. Create a `.env` file in the project root (copy `.env.example`) and fill in your DB credentials. Minimal variables:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
DB_NAME=library_db
USE_REAL_DB=true
CLERK_PORT=6001
```

2. Start the server (it will mount the real `clerkRoutes` and the SQL-backed handlers will be used):

```powershell
node ClerkRole/server_clerk.js
```

3. The SQL controllers expect tables such as `books`, `borrow_records`, `fines`, and `library_policy` to exist. If you don't have these, either keep mock mode (USE_REAL_DB not set) or create the tables using your preferred migration script. The SQL in `ClerkRole/backend/clerkController.js` shows the queries used and can be used as a reference for creating the schema.

Mounting ClerkRole into your main app

If you prefer to serve the clerk UI from your main Express app (for example at `/clerk`), you can mount the router and serve the static frontend files. Example in your `server.js`:

```js
const express = require('express');
const path = require('path');
const app = express();

// serve the static clerk frontend
app.use('/clerk/static', express.static(path.join(__dirname, 'ClerkRole', 'frontend')));

// mount the clerk router (only in real-DB mode it will run SQL controllers)
const clerkRoutes = require('./ClerkRole/backend/clerkRoutes');
app.use('/clerk', clerkRoutes);

// optionally redirect root /clerk to the ClerkRole books page
app.get('/clerk', (req, res) => res.sendFile(path.join(__dirname, 'ClerkRole', 'frontend', 'books.html')));
```

Troubleshooting
- If the server crashes on startup with a MySQL authentication error, ensure you either set `USE_REAL_DB=true` with correct DB credentials in `.env` or leave `USE_REAL_DB` unset (mock mode) so the dev server doesn't attempt a DB connection.
- If you enable `USE_REAL_DB` and encounter SQL errors, check that the expected tables/columns exist. The controller files show the SQL statements used.

Contributing / Extending
- To persist mock data between restarts, we can save seeds to a JSON file and load it on startup — tell me if you'd like that and I can add it.
- To make the sidebar shared across other apps, move `clerk-menu.js` and `clerk-menu.css` into a shared `public/` folder and include them where needed.

Contact / Next steps
- If you want a packaged npm script to start the ClerkRole server (for example `npm run clerk`), I can add a `scripts` entry to `package.json`.
- If you want me to add a simple JSON persistence for mock data (so added users/books survive restarts), say so and I'll add it.

Enjoy — this README should let your friend run the ClerkRole UI locally and try the clerk features without configuring a database.

