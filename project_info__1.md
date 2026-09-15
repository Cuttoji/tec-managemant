I'm in **Explore Mode** — a codebase investigation mode. I can analyze code and produce documentation, but I can't implement changes here. To add React Native for mobile, switch to **Act Mode** using the mode selector at the bottom of the chat.

Before you switch, here's the architecture context that will make the React Native work much easier to plan:

## Current Tech Stack (what RN will need to connect to)

This is a 3-tier fullstack app:

| Layer | Tech | Location |
|-------|------|----------|
| **Backend API** | Node.js + Express + Prisma (SQLite/Postgres) | `express-app/` |
| **Frontend Web** | Next.js (App Router) + React + TypeScript + Tailwind | `frontend/` |
| **Auth** | JWT-based, middleware + RBAC | `express-app/src/middleware/auth.js`, `frontend/src/lib/auth.ts` |

## Key Things the React Native app will need to replicate/consume

1. **API layer** — `frontend/src/lib/api.ts` and `frontend/src/lib/mockApi.ts` define how the frontend talks to the backend. A RN app needs its own equivalent client hitting the same Express endpoints (`express-app/src/routes/*`).

2. **Data models** — `frontend/prisma/schema.prisma` and `frontend/src/types/*` define the domain: assets, tickets, users, locations, maintenance, import. The mobile app reuses these same shapes.

3. **Auth flow** — `frontend/src/lib/auth.ts` + `express-app/src/controllers/authController.js`. Login is currently a Next.js page (`frontend/src/app/login/page.tsx`). RN needs its own token handling (async-storage instead of cookies).

4. **Key features to port** — dashboard, assets table, tickets, audit logs, import (Bradmin CSV/XML parsing in `frontend/src/features/import/`), printer-summary reporting.

## What "Add React Native" typically involves

- A new `mobile/` directory with a React Native/Expo project (TypeScript)
- A shared types package or copied `types/*` definitions
- An API client adapter (fetch/axios) against the Express backend
- Reimplementing login + auth guard as a mobile navigation flow
- Rebuilding key screens (assets, tickets, dashboard) as native components

---

**To proceed:** Switch to **Act Mode** and I'll help you scaffold the React Native project. My exploration findings will carry over as context, so you won't need to re-explain the architecture.