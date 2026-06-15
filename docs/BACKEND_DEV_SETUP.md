# Backend Dev Setup

## Prerequisites

- Node.js and npm
- Docker Desktop running, or a local PostgreSQL server on port `5432`

## Local Database

Start only the PostgreSQL database:

```bash
cd backend
npm run db:up
```

Stop it:

```bash
npm run db:down
```

If Docker Desktop is not running, `npm run db:up` will fail with a Docker daemon connection error.

## Environment

Copy `backend/.env.example` to `backend/.env` and adjust as needed.

For a throwaway local smoke test only:

```env
NODE_ENV=development
DB_SYNCHRONIZE=true
ALLOW_PUBLIC_OPERATIONS=true
JWT_SECRET=dev-secret-change-me
```

For production-like local testing:

```env
NODE_ENV=development
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
ALLOW_PUBLIC_OPERATIONS=false
JWT_SECRET=replace-with-a-long-secret
```

## Migrations

The operations platform migration entrypoint is:

```bash
npm run typeorm -- migration:show -d src/migrations/data-source.ts
npm run migration:run
npm run seed
```

The current migration creates the operations tables for projects, tasks, work logs, time entries, audits, assessments, and expenses.

## Smoke Token

Generate a local bearer token for guarded operations endpoints:

```bash
npm run token:smoke
```

Use it with:

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/projects
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/operations/summary
```

## Verification

```bash
npm run lint:check
npm test
npm run build
npm audit --audit-level=moderate
```

Current backend tests cover the operations JWT guard and organization-scoped service behavior. Current frontend tests cover demo/real API fallback behavior for operations data and the production demo-mode guard.

When PostgreSQL is running, start the API:

```bash
npm run start:prod
```

Then check:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/projects
```

`/api/projects` should return `401` unless you set `ALLOW_PUBLIC_OPERATIONS=true` or send a valid bearer token with `organizationId` in the payload.

Or run the automated smoke check:

```bash
npm run smoke:api
```

It verifies:

- `/api/health` returns `200`
- `/api/projects` without a token returns `401`
- `/api/projects` with a smoke token returns `200`
- `/api/operations/summary` with a smoke token returns `200`

## Frontend Real API Check

Run the frontend with:

```bash
cd ../admin-web
npm test -- run
npm run dev -- --host 127.0.0.1 --port 5173
```

To test guarded real API data manually in the browser console, create a token in `backend`:

```bash
npm run token:smoke
```

Then set it in the frontend origin:

```js
localStorage.setItem('token', '<TOKEN>');
localStorage.setItem('user', JSON.stringify({
  id: 'demo-owner',
  email: 'owner@example.com',
  name: 'Demo Owner',
  roles: ['admin'],
  permissions: ['operations:read', 'operations:write'],
  organization: { id: 'demo-org', name: 'Demo Organization' },
  isActive: true
}));
location.href = '/dashboard';
```

This uses the real backend token path instead of the local `demo-token` fallback.

For production frontend builds, `demo-token` is ignored unless `VITE_ENABLE_DEMO_MODE=true` is explicitly set.
