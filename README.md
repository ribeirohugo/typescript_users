# Example: Users & Authentication

Minimal standalone app with just a `users` and `auth` module, built with the same stack and
conventions as the main `backend/` and `frontend/` apps in this repo (NestJS + Prisma +
Passport-JWT, React + Vite + TypeScript + Tailwind).

- `backend/` — NestJS API: `users` module (admin-only CRUD) and `auth` module
  (register/login/profile, local + JWT Passport strategies, role guard).
- `frontend/` — React app: login/register pages, a protected dashboard, a profile page, and an
  admin-only users page.

## Setup

Requires a PostgreSQL database (the main project's `docker-compose`/Postgres instance works, or
any local Postgres).

```bash
# Backend
cd example/backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npm run prisma:migrate:dev
npm run dev             # http://localhost:3000/api/v1

# Frontend (separate terminal)
cd example/frontend
npm install
npm run dev              # http://localhost:5173
```

Register an account at `/register`. The first user is created with role `USER`; promote it to
`ADMIN` directly in the database to access the `/users` admin page.
