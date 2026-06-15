# Verification

Run all backend and frontend checks from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

For a faster local pass without dependency audits:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -SkipAudit
```

The script runs:

- backend tests, check-only lint, and build
- frontend tests, check-only lint, and build
- backend and frontend dependency audits, unless `-SkipAudit` is used

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

The helper runs a Docker preflight first. If Docker Desktop is not running, it stops before migrations and prints the exact action needed.
