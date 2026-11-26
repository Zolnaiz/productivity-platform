# Backend API

NestJS 11 + TypeORM + PostgreSQL. The only part of the system that writes to the database: every rule
(permissions, scores, K1–K7, month close) is decided here. How it is organised is in
[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) §2; every file in `src/` starts with a comment saying what it
is for.

## Run it locally

```bash
cp .env.example .env          # then set JWT_SECRET, JWT_REFRESH_SECRET, DB_*
npm install
npm run db:up                 # PostgreSQL in Docker (docker-compose.db.yml)
npm run migration:run
npm run seed                  # optional: demo organisation, people, 5S zones
npm run start:dev             # http://localhost:3000/api
```

Details, including PostgreSQL without Docker: [../docs/BACKEND_DEV_SETUP.md](../docs/BACKEND_DEV_SETUP.md).

## Commands

| Command | Does |
|---|---|
| `npm run start:dev` | API with reload on change |
| `npm run build`, `npm run start:prod` | Compile to `dist/` and run it |
| `npm run lint:check` | ESLint without fixing |
| `npm test` | Unit and HTTP tests (`src/**/*.spec.ts`) |
| `npm run test:cov` | The same with coverage |
| `npm run test:uc` | Use-case acceptance tests on a real PostgreSQL (`test/use-cases/`) |
| `npm run migration:run` / `migration:revert` | Apply / undo the last migration |
| `npm run migration:generate -- src/migrations/<Timestamp>-<Name>` | New migration from entity changes; name it `*Operations*` or `*Runtime*` or it will not run |
| `npm run migration:check` | Fails when entities and migrations disagree |
| `npm run seed` | Demo data (`scripts/seed-operations.ts`) |
| `npm run bench` | Performance benchmark into `docs/benchmark-results.json` |
| `npm run results` | Runs every suite and writes `docs/RESULTS.md` |
| `npm run token:smoke`, `npm run smoke:api` | Smoke test against a running API |
| `npm run attachments:check` | Compares attachment rows with the stored files (read-only) |
| `npm run db:up` / `db:down` / `db:logs` | Development PostgreSQL in Docker |

## Adding a feature

1. Entity in `src/operations/entities/`, then a migration (`*Operations*` in its name).
2. Pure rules in a plain `src/operations/<name>.ts` with a `<name>.spec.ts` beside it.
3. Service for database work, controller for routes; each route declares its permission
   (`@RequirePermission('area:action')`), and the permission is added to the roles in `src/shared/roles.ts`.
4. Errors as `apiError(ErrorCode.X)`, with the code added to `src/shared/errors/api-error.ts` and translated
   in both clients.
5. A use case in `test/use-cases/` when the feature is a user-visible flow.
6. A line in `docs/DECISIONS.md` if you chose between alternatives.
