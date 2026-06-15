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

## Frontend

```powershell
cd admin-web
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

Use **Demo workspace** on the login page to explore without a backend in development. Production builds only show and honor demo mode when `VITE_ENABLE_DEMO_MODE=true` is set intentionally.

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

Build and run PostgreSQL plus the backend API:

```powershell
docker compose up --build
```

This default compose setup is intended for local development. For production, set `NODE_ENV=production` and provide a strong `JWT_SECRET` with at least 32 characters through your environment or deployment secret manager.

For a local development-friendly backend container with Swagger and public operations enabled:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The React frontend is currently run natively from `admin-web`.

## Security Notes

- Production requires `JWT_SECRET`.
- Production rejects `DB_SYNCHRONIZE=true`.
- Swagger is disabled in production unless `ENABLE_SWAGGER=true`.
- Public operations access is disabled by default.
- Operations API data is scoped by `organizationId`.
- Backend API has global rate limiting configured by `RATE_LIMIT_TTL_MS` and `RATE_LIMIT_LIMIT`.
- Backend logs include `X-Request-Id` correlation IDs and redact sensitive payload fields.
- PostgreSQL backup/restore guidance is documented for Docker and non-Docker environments.
- Frontend admin routes are role-guarded (`admin`/`super_admin`; audit log is `super_admin` only).
- Frontend production mode does not silently fall back to demo data for real backend failures.
- Frontend demo mode is disabled in production unless `VITE_ENABLE_DEMO_MODE=true`.
- Auth responses are normalized between backend JWT contracts and frontend role guards.
- JWT lifetime and refresh secret settings are read through validated backend configuration.

## Current Verification Status

- Backend tests: 52 passing
- Frontend tests: 26 passing
- Backend lint/build/audit passing
- Frontend lint/build/audit passing
