# Verification

Run all backend and frontend checks from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

For a faster local pass without dependency audits:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -SkipAudit
```

When Flutter is installed and available on PATH, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -IncludeMobile
```

To include the PostgreSQL runtime smoke and Playwright browser smoke:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -IncludeE2E
```

The script runs:

- backend tests, check-only lint, and build
- frontend tests, check-only lint, and build
- production Docker Compose config validation for default, cache, backup, and monitoring profiles when the Docker CLI is installed
- backend and frontend dependency audits, unless `-SkipAudit` is used
- runtime PostgreSQL/API smoke and Playwright browser smoke only when `-IncludeE2E` is used
- mobile Flutter pub get/analyze/test only when `-IncludeMobile` is used

Dependency audits call the npm registry. If the environment blocks network access, run `verify.ps1 -SkipAudit` first, then run `npm audit --audit-level=moderate` inside `backend` and `admin-web` when network access is available.

Database runtime smoke is separate because it requires PostgreSQL or Docker Desktop:

```powershell
cd backend
npm run db:up
npm run migration:run
npm run seed
npm run start:prod
npm run smoke:api
```

Or run the PowerShell helper from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\runtime-smoke.ps1
```

Use `-KeepBackendRunning` to leave the backend process running after the smoke checks pass.

Mobile verification can also be run directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\mobile-verify.ps1
```

The helper runs a Docker preflight first. If Docker Desktop is not running, it stops before migrations and prints the exact action needed.

Production compose syntax and environment interpolation can be checked without starting containers:

```powershell
docker compose --env-file .env.production.example -f docker-compose.prod.yml config
docker compose --env-file .env.production.example -f docker-compose.prod.yml --profile backup config
docker compose --env-file .env.production.example -f docker-compose.prod.yml --profile monitoring config
docker compose --env-file .env.production.example -f docker-compose.prod.yml --profile cache config
```

## Current Local Baseline

As of the latest local verification:

- Backend unit tests: 63 passing
- Frontend tests: 53 passing
- Backend lint/build: passing
- Frontend lint/build: passing
- Backend dependency audit: 0 vulnerabilities
- Frontend dependency audit: 0 vulnerabilities
- Production compose default/cache/backup/monitoring config: passing with `.env.production.example`
- Docker PostgreSQL runtime smoke: passing
- Runtime auth migration, operations migration, seed, health, auth-required, seeded owner login, smoke-token projects, login-token summary, and project create/update/delete checks: passing
- Playwright browser smoke: seeded owner login and Projects page load passing
- Mobile verification hook: ready, blocked until Flutter CLI is available on PATH

Backend metrics can be checked at:

```text
http://localhost:3000/api/metrics
```

Set `ENABLE_METRICS=true` before using the production monitoring profile.

For a quick frontend dev-server health check:

```powershell
cd admin-web
npm run dev -- --host 127.0.0.1 --port 3001
```

Then open `http://127.0.0.1:3001` or request it with PowerShell:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:3001 -UseBasicParsing
```

Browser-level frontend smoke can be run when the backend is already seeded and running:

```powershell
cd admin-web
npx playwright install chromium
npm run test:e2e
```
