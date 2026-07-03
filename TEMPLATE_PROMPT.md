# Template Prompt: Bootstrapping a New App from `typescript_users`

> Copy everything below the divider into the first message of a new Claude Code (or similar
> coding-agent) session when starting a new project from this template. Fill in the placeholders
> (`{{...}}`) before sending. Keep this file itself in the template repo, unmodified, as the
> source of truth.

---

## Your role

You are setting up a new full-stack application named **{{APP_NAME}}** (`{{app_slug}}`), built to
the same structure, stack, and conventions as the `typescript_users` reference template. Treat
that template as the architectural source of truth: replicate its structure and tooling exactly,
and only change what's specific to this app's domain (data model, routes, UI copy, business
logic).

Domain for this app: {{ONE-PARAGRAPH DESCRIPTION OF WHAT THIS APP DOES AND ITS CORE ENTITIES}}.

If any instruction below conflicts with something the user asks for directly, follow the user —
but flag the deviation and ask before silently dropping a convention (e.g. don't skip tests,
don't remove the lint/format tooling, don't collapse the monorepo layout) unless they explicitly
say to.

## Non-negotiable structure

This is a two-app monorepo, npm workspaces are NOT used — each app manages its own
`package.json`/`package-lock.json` and is run via `--prefix`:

```
{{app_slug}}/
├── backend/           # NestJS API
├── frontend/          # React + Vite SPA
├── docker/
│   └── {{app_slug}}_dev/
│       └── docker-compose.yml   # local Postgres for dev
├── .github/workflows/
│   ├── test-and-lint-backend.yml
│   └── test-and-lint-frontend.yml
├── .husky/
│   └── pre-commit
├── package.json       # root: aggregates scripts across both apps, husky lives here
├── .gitignore
└── README.md
```

Do not merge backend/frontend into one `package.json`, and do not add a shared/common package
unless the user explicitly asks for one — duplication between two small apps is cheaper than a
premature shared-package abstraction.

## Backend stack (`backend/`)

- **NestJS 11**, TypeScript, modules organized by domain (`auth/`, `users/`, one folder per
  resource) — not by technical layer.
- **Prisma 7** with `@prisma/adapter-pg` (driver adapter, not the default engine) + `pg` `Pool`.
  Schema at `prisma/schema.prisma`, config at `prisma/prisma.config.ts` (loads `.env` via
  `dotenv`, exposes `datasource.url` and `migrations.seed`).
- **Auth**: Passport with a `local` strategy (login) and a `jwt` strategy (everything else),
  `@nestjs/jwt` for signing. Guards: `JwtAuthGuard`, `LocalAuthGuard`, `RolesGuard` +
  `@Roles(...)` decorator reading a `Role` enum from the Prisma schema.
- **Validation**: `class-validator` + `class-transformer` DTOs for every endpoint. Global
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in
  `main.ts`.
- **API shape**: global prefix `api`, URI versioning (`/api/v1/...`), CORS enabled.
- **Passwords**: `bcrypt`, `SALT_ROUNDS = 10`, hashed at the service layer, never in DTOs/
  controllers. Never return the `password` field — every service has a private
  `exclude(user)` helper doing `const { password: _, ...rest } = user; return rest;`.
- **Password strength**: every DTO that accepts a new password (register, admin create/update
  user, change-password) uses the shared `IsStrongPassword()` decorator
  (`backend/src/common/is-strong-password.decorator.ts`, wraps class-validator's built-in
  `IsStrongPassword` with fixed options: min 8 chars, 1 lowercase, 1 uppercase, 1 number, 1
  symbol) instead of a bare `@MinLength(8)`. The frontend mirrors the exact same rule via a
  shared `passwordSchema`/`getPasswordError`/`PASSWORD_HINT` in `frontend/src/lib/password.ts`,
  used by every form with a password field (register, admin create/edit user, change-password) —
  don't duplicate the regex/rules inline in a form's zod schema.
- **Soft delete over hard delete**: "deleting" a resource sets `isActive: false`, it does not
  remove the row. Inactive users are treated as not-found by lookups that gate on it.
- **Immutable fields called out explicitly**: if a field must never change via an update
  endpoint (e.g. email), enforce it by leaving it out of the update DTO entirely — don't accept
  it and silently ignore it.
- **Password changes are a separate endpoint** from general profile updates
  (`PATCH .../password` vs `PATCH ...`), each with its own DTO, because they have different
  authorization semantics (current-password re-verification).
- **Seeding**: `prisma/seed.ts`, wired via `prisma.config.ts`'s `migrations.seed` and an
  `npm run seed` script. Reads credentials from env vars with dev-only fallback defaults, and
  `upsert`s (idempotent, safe to rerun).

## Frontend stack (`frontend/`)

- **React 19 + Vite + TypeScript**, Tailwind v4 (via `@tailwindcss/vite`, no separate config
  file needed).
- Routing: `react-router-dom`, pages lazy-loaded with `React.lazy` + a shared `Suspense`
  fallback. Route guards as wrapper route elements (`ProtectedRoute`, `AdminRoute`) rendering
  `<Outlet />`, not per-page checks.
- Server state: `@tanstack/react-query`. Forms: `react-hook-form` + `zod` resolvers.
- HTTP: a single `axios` instance in `lib/api.ts` with a request interceptor attaching the JWT
  from `localStorage` and a response interceptor handling 401 (clear token, redirect to
  `/login`).
- Auth state: React Context (`contexts/AuthContext.tsx` + `contexts/auth-context.ts` split so
  fast-refresh doesn't choke on a file exporting both a component and a non-component value),
  exposed via a `useAuth()` hook.
- Folder layout: `api/` (one file per backend resource, thin wrapper functions), `components/`
  (grouped by concern: `auth/`, `layout/`, `ui/`), `contexts/`, `hooks/`, `lib/`, `pages/`,
  `types/`.
- Path alias `@/*` → `src/*` in both `tsconfig.app.json` and `vite.config.ts`.

## Tooling — set this up identically, don't reinvent it

- **ESLint**: flat config (`eslint.config.mjs` in backend, `eslint.config.js` in frontend),
  `typescript-eslint` recommended + `eslint-config-prettier` last in the chain. Backend adds a
  `**/*.spec.ts` override with Jest globals. Frontend adds `react-hooks` + `react-refresh`
  plugins and browser globals. `no-unused-vars` is configured with `argsIgnorePattern: '^_'`
  (etc.) to allow the destructure-and-discard exclude pattern above.
- **Prettier**: `.prettierrc.json` in each app (`singleQuote`, `trailingComma: all`,
  `printWidth: 100`).
- **Testing**: Jest (`ts-jest`) for backend, colocated `*.spec.ts` next to the file under test,
  mock `PrismaService` (and any other injected service) with plain `jest.fn()` objects passed
  via `useValue` — no real database in unit tests. Vitest + `@testing-library/react` for
  frontend, colocated `*.test.tsx`, `vitest.config.ts` merges `vite.config.ts`, a
  `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` and calls `cleanup()` in
  `afterEach`. Write real assertions, not placeholder tests — cover the actual branches
  (not-found, conflict, wrong-password, happy path) for every service method.
- **Per-app scripts** (identical names in both `package.json`s): `dev`, `build`, `lint:check`,
  `lint:fix`, `format:check`, `format:fix`, `test`. Backend additionally: `prisma:generate`,
  `prisma:migrate:dev`, `prisma:migrate:deploy`, `seed`.
- **Root `package.json`** aggregates: `dev` (via `concurrently`, runs both apps' `dev` scripts
  in parallel), `docker:dev` (brings up `docker/{{app_slug}}_dev/docker-compose.yml`),
  `format:check`/`format:fix`/`lint:check`/`lint:fix`/`test` (each runs backend then frontend
  via `--prefix`), and `prepare: husky`.
- **Husky pre-commit** (`.husky/pre-commit`) runs, per app: `format:check`, `lint:check`,
  `test`, `build` — frontend first, then backend (order doesn't matter functionally, just be
  consistent). Keep it a plain script; don't add lint-staged unless the user asks — this
  project intentionally lints/tests/builds the whole app on every commit, not just staged
  files.
- **CI**: one GitHub Actions workflow per app (`test-and-lint-{backend,frontend}.yml`),
  triggered only on changes under that app's path (`paths: [backend/**]` /
  `[frontend/**]`), each with separate `lint`, `test`, `build` jobs (backend's `test` job also
  spins up a `postgres` service container and runs migrations first). Name each workflow
  `"[backend] CI"` / `"[frontend] CI"` with a matching `run-name` including the branch
  (`github.ref_name`) and the commit message, so parallel runs are easy to tell apart in the
  Actions UI.

## Docker (dev only)

- `docker/{{app_slug}}_dev/docker-compose.yml`: a single `postgres:17-alpine` service, fixed
  container name `{{app_slug}}_postgres`, fixed dev credentials (`postgres`/`postgres`), DB
  name matching the app slug, port `5432` published, named volume for data. Don't containerize
  the apps themselves for local dev — Postgres is the only thing worth dockerizing here; run
  `backend`/`frontend` on the host via `npm run dev`.

## Environment files

- One `.env.example` per app that needs one (currently just `backend/.env.example`):
  `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SUPER_ADMIN_EMAIL`,
  `SUPER_ADMIN_PASSWORD`. Real `.env` files are gitignored; never commit one.

## What to adapt for this app

The `User`/`Role` model and the `auth`/`users` modules are the baseline, not a placeholder —
every app built from this template has users and authentication, so keep them as-is (field
names, `Role` enum, soft-delete via `isActive`, the auth endpoints) and only extend them if the
domain genuinely needs more user fields. Do not remove or replace them.

Add, per the domain description above:

1. `backend/prisma/schema.prisma` — new models for whatever entities the domain needs, alongside
   the existing `User`/`Role`, following the same field-naming and `@@map` conventions.
2. Backend modules beyond `auth`/`users` for the app's actual domain resources — same shape:
   `module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts`, plus `*.spec.ts` for each.
3. Frontend pages/routes/API wrappers for those resources, following the existing
   `api/`, `pages/`, `components/` split.
4. App name/branding: page `<title>`, sidebar/header label, root `package.json` `name`, both
   apps' `package.json` `name`/`description`, `README.md`, the Postgres DB name and dev
   container name (docker-compose + `.env.example`) — all should read `{{APP_NAME}}` /
   `{{app_slug}}`, not leftover placeholder or prior-project names.
5. `README.md` — one paragraph on what the app does, the same "Setup" / "Docker" /
   "Quality checks" sections as the template, updated for this app's specifics.

## What NOT to change without being asked

- The monorepo layout and the "no shared package" rule.
- The lint/format/test tool choices and their configuration shape.
- The pre-commit hook running the full format+lint+test+build pipeline for both apps.
- The soft-delete convention, the exclude-password convention, the DTO-whitelist validation
  convention, the separate change-password endpoint convention, the shared password-strength
  policy (backend + frontend) and case-insensitive email normalization (via a shared
  `normalizeEmail()` helper applied wherever an email is written or looked up, including inside
  the login strategy — not just in DTO transforms).
- Dependency major versions, unless a security advisory or the user requires bumping them — if
  a transitive dependency has a vulnerability with no non-breaking upstream fix, prefer an
  `overrides` pin to the patched version over downgrading direct dependencies.
