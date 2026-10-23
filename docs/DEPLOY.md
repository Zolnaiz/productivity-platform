# Deploy (short version)

These steps deploy the production stack with Docker Compose: PostgreSQL 16, the NestJS API, and the web app behind nginx. [DEPLOYMENT_RUN.md](DEPLOYMENT_RUN.md) is the full walkthrough. It shows the output of every step and lists what went wrong on the first run. Every command below exists in this repository. The file and npm-script names were checked when this page was written.

## 1. Settings

```bash
cp .env.production.example .env.production   # never commit it; .gitignore excludes it
```

Fill in every `replace-with-...` value. Generate each secret separately:

```bash
node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"
```

| Variable | Required | Meaning |
|---|---|---|
| `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET` | yes | Long, random and different from each other. In production the API refuses to start with a weak or short `JWT_SECRET` (it must be at least 32 characters). |
| `DB_PORT` | yes | The host port for PostgreSQL. It is bound to loopback only. Choose another port if 5432 is already in use. |
| `VITE_API_URL` | yes | Normally `/api`. It is built into the web bundle, so changing it means rebuilding `admin-web`. The web app keeps its session in a `SameSite=Strict` cookie, so the API must be on the same site as the web app (the `/api` proxy does this); on another site, people would be signed out every hour. |
| `CORS_ORIGINS` | yes | The origin the web app is served from. It only matters when the app and the API are on different hostnames. |
| `APP_BASE_URL` | for email links | For example `https://app.example.com`. Invitation and password-reset emails carry links built from it. Without it, the email contains only a bare code. |
| `MAIL_TRANSPORT` | no | `log` (the default) only logs the recipient and subject and sends nothing. `smtp` sends real email. |
| `MAIL_FROM`, `SMTP_HOST` | when `smtp` | If either is missing, the API refuses to start with `MAIL_TRANSPORT=smtp`. |
| `SMTP_PORT`, `SMTP_SECURE` | no | Port 587 upgrades the connection to TLS. Port 465 uses TLS from the start. `SMTP_SECURE` overrides the choice. |
| `SMTP_USER`, `SMTP_PASSWORD` | no | Leave both empty for an unauthenticated relay on your own network. |
| `RATE_LIMIT_TTL_MS`, `RATE_LIMIT_LIMIT` | no | The global request limit per client. `forgot-password` (5 per minute) and `reset-password` (10 per minute) have their own, tighter limits. |

Check that Compose can read the file:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config > /dev/null
```

## 2. Build and start

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait
```

`DB_MIGRATIONS_RUN=true` is the Compose default, so migrations are applied when the API starts. To apply them by hand from `backend` with the production database settings, run `npm run migration:run`. To undo the last one, run `npm run migration:revert`.

These services are optional and are switched on with `--profile`: `cache` (Redis), `backup` (scheduled `pg_dump`) and `monitoring` (Prometheus and Grafana).

## 3. First organisation

You have two options:

- open the web app and register. Whoever registers owns the new organisation. Others then join through **People → Invite**, one at a time or from a CSV or Excel file;
- or seed one from `backend` with `npm run seed`. See DEPLOYMENT_RUN.md §5 for the database settings the seed needs on the command line.

## 4. Check

From `backend`, with `SMOKE_API_URL` pointing at the deployment:

```bash
npm run smoke:api            # reads only; SMOKE_WRITES=true also writes, so use it only on a throwaway database
```

`npm run attachments:check` reports any attachment record whose file is missing from storage.

## 5. Test results and measurements

From `backend`:

| Command | What it does |
|---|---|
| `npm test` | Backend unit and HTTP tests |
| `npm run test:uc` | Acceptance tests for UC-01 … UC-22. Needs a PostgreSQL it can write to (`DB_*`). |
| `npm run bench` | p50/p95 latency on 50 users and 10,000 records. Use a throwaway database (`DB_DATABASE=pp_bench`). |
| `npm run results` | Writes [RESULTS.md](RESULTS.md) from the real output of every suite |
