# Tec Manage

A full-stack asset management and maintenance tracking application built with Next.js (App Router) and Prisma on MySQL. The API is implemented as Next.js Route Handlers under `frontend/src/app/api`.

## Overview

Tec Manage helps manage:

- equipment and asset records
- maintenance schedules and work orders
- user authentication and authorization
- CSV/XML import workflows for asset data
- dashboard reporting and operational visibility

## Tech Stack

- Web app + API: Next.js, React, TypeScript, Tailwind CSS
- API routes: Next.js Route Handlers (`frontend/src/app/api`)
- Database: MySQL (Prisma)
- Auth: NextAuth

## Project Structure

```text
.
├── package.json
├── frontend/
│   ├── src/
│   │   ├── app/          # pages + API route handlers
│   │   ├── features/
│   │   ├── components/
│   │   └── lib/
│   └── prisma/
└── README.md
```

## Services and Ports

| Service | URL / Port | Purpose |
| --- | --- | --- |
| MySQL | localhost:3307 | Main database |
| Next.js (web + API) | http://localhost:3002 | Web app and REST API |

## Prerequisites

- Node.js 18+
- npm
- MySQL server

## Manual Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app

```bash
cd frontend
npm install
npm run dev
```

The web app and the REST API routes under `/api` both run on http://localhost:3002.

## Environment Variables

Local development may require these variables in your environment.

### frontend

- `DATABASE_URL=mysql://<user>:<password>@localhost:3307/<database>`
- `NEXTAUTH_URL=http://localhost:3002`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`

## Common Commands

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run type-check
```

## Notes

- The root package defines an npm workspace for `frontend`.
- Prisma schema and seed scripts live in `frontend/prisma`, and the app is set up to work with MySQL.
- Bradmin CSV/XML import parsing and authentication are implemented inside the Next.js app (`frontend/src/features/import`, `frontend/src/lib/auth.ts`).

## License

This project does not currently declare a license. Add one if you plan to distribute or publish the repository.
