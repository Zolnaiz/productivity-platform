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

The smoke test reads every page's first request and fails on any 5xx, and
checks no user record carries a password or reset token. On a throwaway
database, `SMOKE_WRITES=true npm run smoke:api` also saves one of everything
people save - a task, a day's work log, a clock entry, a goal, an expense, a
department, an audit run, a plan version, a closed month - which is what CI's
live job runs. Never set it against a live system: it leaves records behind.

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

The current figures live in one place, the README's *Current Verification
Status*, so this page and that one cannot disagree. This page used to carry
its own list, and it had fallen to 63 backend tests and "Flutter not
available" while the README had moved on.

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
