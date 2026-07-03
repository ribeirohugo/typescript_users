# TypeScript Users

A users and authentication app built with NestJS + Prisma + Passport-JWT on the backend, and
React + Vite + TypeScript + Tailwind on the frontend.

- `backend/` — NestJS API: `users` module (admin-only CRUD) and `auth` module
  (register/login/profile, local + JWT Passport strategies, role guard).
- `frontend/` — React app: login/register pages, a protected dashboard, a profile page, and an
  admin-only users page.

## Setup

Requires a PostgreSQL database. The quickest way to get one running locally is via
`docker/typescript_users_dev/docker-compose.yml` (see below), or any local Postgres instance.

```bash
# Backend
cd backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npm run prisma:migrate:dev
npm run seed             # creates the super admin user
npm run dev               # http://localhost:3000/api/v1

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Or, from the repo root, run both apps at once with `npm run dev`.

Register an account at `/register`. The first user is created with role `USER`; promote it to
`ADMIN` directly in the database (or use the seeded super admin) to access the `/users` admin page.

## Docker

```bash
npm run docker:dev
```

Starts Postgres, the backend, and the frontend together (see `docker/typescript_users_dev/`).

## Quality checks

Each app (`backend/`, `frontend/`) has `lint:check`, `lint:fix`, `format:check`, `format:fix`, and
`test` scripts; the root `package.json` aggregates them across both apps. A Husky `pre-commit`
hook runs format, lint, tests, and build for both apps before every commit.
