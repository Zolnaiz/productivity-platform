# Productivity Platform

Productivity Platform is a web-based operations and productivity management system for planning work, tracking execution, recording employee work logs and time, running 5S/quality/safety audits, and producing monthly operational reports.

## What It Covers

- Projects, tasks, kanban, calendar, and work logs
- Employee time entries and monthly summaries
- 5S, safety, quality, compliance, risk, and operational excellence audit templates
- Assessment forms and responses
- Expenses and reporting
- Admin, organization, department, user, settings, and audit-log areas
- Demo workspace for frontend exploration
- Backend operations API with JWT and organization scoping

## Structure

```text
admin-web/        React + TypeScript admin web app
backend/          NestJS API for operations data
docs/             Product, setup, and verification docs
mobile-flutter/   Mobile app workspace placeholder/reference
scripts/          Repository-level helper scripts
```

## Quick Verification

From the repository root on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

This runs backend tests/lint/build/audit and frontend tests/lint/build/audit.

For a faster local pass:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -SkipAudit
```

When Flutter is installed and available on PATH, include mobile checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -IncludeMobile
```

To include PostgreSQL runtime smoke plus browser login smoke:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -IncludeE2E
```

## Frontend

```powershell
cd admin-web
npm install
npm run dev -- --host 127.0.0.1 --port 3001
```

Open:

```text
http://127.0.0.1:3001
```

Use **Demo workspace** on the login page to explore without a backend in development. Production builds only show and honor demo mode when `VITE_ENABLE_DEMO_MODE=true` is set intentionally.

For the PostgreSQL-backed smoke seed, use `owner@example.com` / `Password123`.

The development server port can be changed when 3001 is busy:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

## Backend

```powershell
cd backend
npm install
npm run build
npm test -- --runInBand
```

For PostgreSQL-backed local smoke testing, see:

- [Backend Dev Setup](docs/BACKEND_DEV_SETUP.md)
- [Verification](docs/VERIFY.md)
- [PostgreSQL Backup And Restore](docs/POSTGRES_BACKUP_RESTORE.md)

## Mobile

The Flutter workspace is in `mobile-flutter`. After installing Flutter SDK and adding `flutter\bin` to PATH:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mobile-verify.ps1
```

## Local API Smoke Flow

Requires Docker Desktop or a local PostgreSQL server:

```powershell
cd backend
npm run db:up
npm run migration:run
npm run seed
npm run start:prod
npm run smoke:api
```

Or from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runtime-smoke.ps1
```

## Docker

Build and run PostgreSQL plus the backend API for local development:

```powershell
docker compose up --build
```

This default compose setup is intended for local development. For production, set `NODE_ENV=production` and provide a strong `JWT_SECRET` with at least 32 characters through your environment or deployment secret manager.

For a local development-friendly backend container with Swagger and public operations enabled:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The production compose file includes PostgreSQL, the NestJS API, and a static nginx container for `admin-web`:

```powershell
Copy-Item .env.production.example .env.production
notepad .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml config
docker compose --env-file .env.production -f docker-compose.prod.yml up --build
```

Optional production profiles:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml --profile backup up --build
docker compose --env-file .env.production -f docker-compose.prod.yml --profile monitoring up --build
docker compose --env-file .env.production -f docker-compose.prod.yml --profile cache up --build
```

## Security Notes

- Production requires `JWT_SECRET`.
- Production rejects known weak JWT and refresh-token secrets.
- Production rejects `DB_SYNCHRONIZE=true`.
- Swagger is disabled in production unless `ENABLE_SWAGGER=true`.
- Public operations access is disabled by default.
- Operations API data is scoped by `organizationId`.
- Operations updates preserve the original organization scope and ignore payload attempts to move records across organizations.
- Operations API supports scoped project soft-delete and the runtime smoke cleans up its write test project.
- Runtime PostgreSQL smoke uses a seeded organization/user and validates real `/auth/login` JWT flow before exercising operations writes.
- Backend API has global rate limiting configured by `RATE_LIMIT_TTL_MS` and `RATE_LIMIT_LIMIT`.
- Frontend API requests include `X-Request-Id`; backend logs and responses expose the same ID for correlation.
- Backend logs redact sensitive payload fields.
- Backend unexpected errors return a generic client message while detailed exception data stays in logs.
- Backend exposes Prometheus-compatible metrics at `/api/metrics` only when `ENABLE_METRICS=true`.
- Unused Socket.IO dependencies were removed and backend `js-yaml` is pinned through overrides to keep dependency audits clean.
- PostgreSQL backup/restore guidance is documented for Docker and non-Docker environments.
- Frontend admin routes are role-guarded (`admin`/`super_admin`; audit log is `super_admin` only).
- Frontend production mode does not silently fall back to demo data for real backend failures.
- Frontend demo mode is disabled in production unless `VITE_ENABLE_DEMO_MODE=true`.
- Frontend API calls clear stale `demo-token` auth data instead of sending it in production.
- Frontend operations mutations strip client-owned `id` and `organizationId` before real backend calls.
- Frontend demo/local storage data recovers from corrupted browser storage instead of crashing the app.
- Frontend module pages use explicit loading and empty states for operations, admin, people, quality, reports, and personal-productivity flows.
- Production Docker config validates required secrets before startup and includes the `admin-web` static container.
- Auth responses are normalized between backend JWT contracts and frontend role guards.
- JWT lifetime and refresh secret settings are read through validated backend configuration.

## Current Verification Status

- Backend tests: 63 passing
- Frontend tests: 53 passing
- Backend lint/build/audit passing
- Frontend lint/build/audit passing
- Docker PostgreSQL runtime smoke passing with seeded owner login and project create/update/delete checks
- Playwright browser smoke passing for seeded owner login and Projects page load
