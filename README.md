# Tec Manage

A full-stack asset management and maintenance tracking application built with a Node.js/Express API, a Next.js frontend, and PostgreSQL. The project is organized as a multi-package workspace and can be run locally with Docker Compose or by starting each service manually.

## Overview

Tec Manage helps manage:

- equipment and asset records
- maintenance schedules and work orders
- user authentication and authorization
- CSV/XML import workflows for asset data
- dashboard reporting and operational visibility

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Database: PostgreSQL 16
- Containerization: Docker + Docker Compose

## Project Structure

```text
.
├── docker-compose.yml
├── package.json
├── express-app/
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── prisma/
│   └── package.json
├── mobile/
│   └── Expo app scaffold
└── README.md
```

## Services and Ports

| Service | URL / Port | Purpose |
| --- | --- | --- |
| PostgreSQL | localhost:5432 | Main database |
| Express API | http://localhost:3000 | REST API |
| Next.js Frontend | http://localhost:3002 | Web app |

## Prerequisites

- Node.js 18+
- npm
- Docker Desktop or Docker Engine
- Docker Compose

## Quick Start with Docker

From the project root:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on port 5432
- API on port 3000
- frontend on port 3002

To stop the stack:

```bash
docker compose down
```

To completely reset the database volume:

```bash
docker compose down -v
```

## Manual Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Start the backend

```bash
cd express-app
npm install
npm run dev
```

The API runs on http://localhost:3000.

### 3) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The web app runs on http://localhost:3002.

## Environment Variables

The Docker setup configures these values automatically, but local development may require matching variables in your environment.

### API

- `PORT=3000`
- `DATABASE_URL=postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev`
- `JWT_SECRET`
- `CORS_ORIGINS=http://localhost:3002`

### Frontend

- `NEXTAUTH_URL=http://localhost:3002`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`

## Common Commands

### Backend

```bash
cd express-app
npm run dev
npm test
npm run prisma:generate
npm run prisma:migrate
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run type-check
```

## Notes

- The root package defines a workspace setup for the backend and frontend.
- Prisma schemas exist in both the backend and frontend package, and the app is set up to work with PostgreSQL.
- The Express app includes import logic for Bradmin CSV/XML data and JWT-based auth middleware.

## License

This project does not currently declare a license. Add one if you plan to distribute or publish the repository.
