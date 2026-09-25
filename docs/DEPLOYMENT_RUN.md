# Deployment Run

This is the production deployment walked end to end on a machine with Docker,
with the output that says each step worked. Everything below was run, not
reasoned about. Before this run the production path had never been executed by
anybody, and five things were broken; they are fixed on this branch and
described at the bottom under *What went wrong*.

Read that section before you start. Two of the failures are silent — they leave
you with a stack that looks healthy and is not.

You need Docker with Compose v2. Nothing else: the images build Node and nginx
themselves. The host-side steps (seed, smoke) additionally need Node 20 and a
checkout of this repository.

---

## 1. Settings

```powershell
Copy-Item .env.production.example .env.production
```

Open it and replace every `replace-with-...` value. `DB_PASSWORD`, `JWT_SECRET`
and `JWT_REFRESH_SECRET` must each be long and random; the backend refuses to
start in production on a known weak secret, and `JWT_SECRET` must be at least 32
characters. Generate them with:

```powershell
node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"
```

Three settings decide the shape of the deployment.

**`DB_PORT`** — PostgreSQL is published on loopback only, so that the seed, the
backup and `psql` can reach it from the host. **If the server already runs its
own PostgreSQL, 5432 is taken and you must pick another port.** Check first:

```powershell
Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
```

If that prints anything, set `DB_PORT` to something free — this run used
`15432`. Docker Desktop does **not** refuse the clash. It accepts the binding
and the host port keeps answering from the old server, so the seed fails with
`password authentication failed` against a database you never meant to touch.
See *What went wrong*, failure 3.

**`VITE_API_URL`** — leave it at `/api` unless you are splitting the
application and the API across two hostnames. nginx serves the application and
proxies `/api` to the backend container, so both share one origin. It is baked
into the JavaScript bundle at build time, so changing it later needs
`build admin-web`, not a restart.

**`CORS_ORIGINS`** — with `VITE_API_URL=/api` the browser never makes a
cross-origin call and this is not used, but compose still requires a value.
If you do split the hostnames, it must name the origin the application is served
from or every call is blocked by the browser.

`.env.production` holds the database password and both JWT secrets. It is
ignored by git. Keep it that way.

Check compose can read it:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

Silence, or the resolved file, means every required variable is set. A missing
one names itself:

```
error while interpolating services.backend.environment.JWT_SECRET: required variable JWT_SECRET is missing a value: Set JWT_SECRET in .env.production
```

## 2. Build

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml build
```

```
 Image agent-...-admin-web Built
 Image agent-...-backend Built
```

Roughly four minutes cold, two images: the NestJS API on Node 20 and the
admin-web bundle behind nginx 1.27.

## 3. Start

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --wait
```

`--wait` is the point. Without it the command returns as soon as the containers
are *created* and you find out later that one never became healthy. With it,
compose blocks until every health check passes:

```
 Container productivity-postgres-prod   Healthy
 Container productivity-backend-prod    Healthy
 Container productivity-admin-web-prod  Healthy
```

If it returns an error instead, that is the deployment failing, and
`docker logs productivity-backend-prod` is the next thing to read.

## 4. The migrations ran

The backend runs them itself on startup, because `DB_MIGRATIONS_RUN=true`. You
do not run `migration:run` separately.

```powershell
docker exec productivity-postgres-prod psql -U productivity_prod -d productivity_prod -c "select count(*) from migrations;"
```

```
 count
-------
    26
```

Twenty-six is the whole set. The two `1700000000xxx` files in
`backend/src/migrations` belong to the retired questionnaire schema and are
deliberately excluded — `backend/tsconfig.json` only compiles migrations whose
filename contains `Operations` or `Runtime`, so they are not in the image at
all. **A new migration named after neither is silently never applied.**

And the schema:

```powershell
docker exec productivity-postgres-prod psql -U productivity_prod -d productivity_prod -c "\dt"
```

Twenty-one tables, including `organizations`, `users`, `five_s_layouts`,
`five_s_guidelines`, `attachments`, `audit_runs` and `migrations`.

## 5. Seed the organization, the owner and the 5S standard

From `backend`, with the production database settings passed in. **The seed
script does not read `.env.production`** — it reads `backend/.env`, which you do
not have — so the values go on the command line. `DB_PORT` is the host port you
chose in step 1, not 5432 inside the container.

```powershell
cd backend
npm ci
$env:DB_HOST="127.0.0.1"; $env:DB_PORT="15432"
$env:DB_USERNAME="productivity_prod"; $env:DB_DATABASE="productivity_prod"
$env:DB_PASSWORD="<the DB_PASSWORD from .env.production>"
npm run seed
```

```
Seeded operations demo data for organization "11111111-1111-4111-8111-000000000001" and user "owner@example.com".
```

Without those variables it fails against whatever is on `localhost:5432`:

```
error: password authentication failed for user "postgres"
```

Check what it made:

```powershell
docker exec productivity-postgres-prod psql -U productivity_prod -d productivity_prod -c "select (select count(*) from organizations) as orgs, (select count(*) from users) as users, (select jsonb_array_length(content->'assessmentCriteria') from five_s_guidelines) as criteria;"
```

```
 orgs | users | criteria
------+-------+----------
    1 |     1 |       35
```

Thirty-five assessment criteria is the 5S standard. The owner is
`owner@example.com` / `Password123`. **Change that password before anyone
outside the room can reach the server**, or seed with `SEED_OWNER_EMAIL` and
`SEED_OWNER_PASSWORD` set to real values.

## 6. The API works

From `backend`, against the running API. `JWT_SECRET` must match the one the
backend container is running with, because the smoke signs its own token.

```powershell
$env:SMOKE_API_URL="http://127.0.0.1:3000/api"
$env:JWT_SECRET="<the JWT_SECRET from .env.production>"
npm run smoke:api
```

```
PASS health endpoint status=200
PASS projects requires auth status=401
PASS login with seeded owner status=200
PASS projects with smoke token status=200
PASS operations summary with login token status=200
PASS create project with login token status=201
PASS update project with login token status=200
PASS delete project with login token status=200
```

Eight checks. The third is a real `/auth/login` with the seeded owner, and the
last three create, update and delete a project and clean up after themselves.

## 7. Every attachment still has its bytes

**Do not run `npm run attachments:check` from the host.** With
`ATTACHMENT_STORE=local` the photographs live on the `attachments_prod` volume
inside the container, and the host has no such directory. The check runs, finds
nothing, and reports every row as missing — the exact false alarm that would
make you think a restore had lost all your evidence:

```
Store: local disk at D:\...\backend\uploads
Attachment rows: 1
Missing bytes for 1 attachment(s):
  bfe9bd9f-...  audit_run 99999999-...  evidence  evidence.png  1ebd914f-....png
```

The bytes were there the whole time. Run it where they are instead — a throwaway
container on the compose network, using the backend image's own dependencies
with the volume and the scripts mounted in. Substitute your compose project name
(`docker volume ls` will show it; it is the directory name the stack was started
from):

```powershell
docker run --rm `
  --network productivity-platform_productivity-network-prod `
  -v productivity-platform_attachments_prod:/app/uploads:ro `
  -v "${PWD}\backend\scripts:/app/scripts:ro" `
  -v "${PWD}\backend\src:/app/src:ro" `
  -v "${PWD}\backend\tsconfig.json:/app/tsconfig.json:ro" `
  -e DB_HOST=postgres -e DB_PORT=5432 `
  -e DB_USERNAME=productivity_prod -e DB_DATABASE=productivity_prod `
  -e DB_PASSWORD="<the DB_PASSWORD from .env.production>" `
  -e ATTACHMENT_STORE=local -e UPLOAD_DIR=/app/uploads `
  productivity-platform-backend `
  npx ts-node --transpile-only scripts/check-attachments.ts
```

```
Store: local disk at /app/uploads
Attachment rows: 1
Every attachment row has its bytes.
```

It exits non-zero if any row has lost its file. The mounts are needed because
the production image ships only `dist` — `scripts/` and `src/` are not in it, so
`npm run attachments:check` inside the container fails with `MODULE_NOT_FOUND`.

With `ATTACHMENT_STORE=s3` none of this applies: the store is reachable from
anywhere with the credentials, and the check runs from the host unchanged.

## 8. The application is served and reaches the API

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3001/
curl.exe -s http://localhost:3001/api/health
```

```
200
{"success":true,"statusCode":200,"data":{"status":"ok",...}}
```

That second line is the whole point of the nginx `/api` proxy: the call went to
the admin-web container on port 3001 and came back from the backend container on
port 3000. Before the fix it returned `index.html` with a 200 — HTML where the
application expected JSON.

A real sign-in and an authenticated read, through the same proxy:

```powershell
curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"owner@example.com\",\"password\":\"Password123\"}"
```

Returns `200` with an `access_token`. Using it:

```powershell
curl.exe -s http://localhost:3001/api/projects -H "Authorization: Bearer <token>"
```

```
{"success":true,"statusCode":200,"data":[{"id":"11111111-1111-4111-8111-111111111111","name":"Operations productivity rollout",...
```

A deep link falls through to the application rather than 404ing, which is what
makes a refresh on `/projects` work:

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3001/projects
```

```
200
```

## 9. Backups, if you turn them on

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml --profile backup up -d backup
```

The container runs `@daily` by default. Force one to prove it works rather than
waiting until tomorrow to find out it does not:

```powershell
docker exec productivity-backup-prod /backup.sh
```

```
SQL backup created successfully
```

Files land in `backups/` on the host, under `last/`, `daily/`, `weekly/` and
`monthly/`.

**These are gzipped plain SQL, not the custom-format dumps that
`docs/POSTGRES_BACKUP_RESTORE.md` describes.** `pg_restore` cannot read them.
Restore one like this — verified on this run, into a scratch database, which is
the only way you should ever test a restore:

```powershell
docker exec productivity-postgres-prod createdb -U productivity_prod productivity_restore_check
docker cp backups\last\productivity_prod-latest.sql.gz productivity-postgres-prod:/tmp/restore.sql.gz
docker exec productivity-postgres-prod gunzip -f /tmp/restore.sql.gz
docker exec productivity-postgres-prod psql -U productivity_prod -d productivity_restore_check -q -f /tmp/restore.sql
docker exec productivity-postgres-prod psql -U productivity_prod -d productivity_restore_check -c "select (select count(*) from migrations) as migrations, (select count(*) from organizations) as orgs, (select jsonb_array_length(content->'assessmentCriteria') from five_s_guidelines) as criteria;"
```

```
 migrations | orgs | criteria
------------+------+----------
         26 |    1 |       35
```

Then drop the scratch database. The hand-written `pg_dump -Fc` / `pg_restore`
commands in the backup runbook are still correct for backups you take yourself;
they just are not the format this container produces.

The database is only half of it. The photographs are on the `attachments_prod`
volume and are not in any database dump — `docs/POSTGRES_BACKUP_RESTORE.md`
has the commands for copying that volume out, and step 7 above is how you find
out afterwards whether the two halves match.

---

## What went wrong

Five defects, all in the deployment path, all fixed on this branch. The first
stopped the stack dead; the rest were quieter.

**1. The backend container would not start at all.** `backend/Dockerfile` built
on `node:18-alpine`, and NestJS 11 needs Node 20. `@nestjs/typeorm` calls
`crypto.randomUUID()` while the database module is still loading, and on Node 18
there is no global `crypto`:

```
ReferenceError: crypto is not defined
    at generateString (/app/node_modules/@nestjs/typeorm/dist/common/typeorm.utils.js:136:37)
    at Object.<anonymous> (/app/dist/shared/database/database.module.js:28:37)
```

It crashed before opening a port, restarted forever, never went healthy, and
admin-web — which waits for it — never started:

```
dependency failed to start: container productivity-backend-prod is unhealthy
```

Fixed by moving both stages to `node:20-alpine`. CI and the admin-web image were
already on Node 20; the backend image was the only thing left behind.

**2. The admin-web container was permanently unhealthy while working fine.**
`nginx.conf` says `listen 3001`, which binds IPv4 only, and the health check
asked for `http://localhost:3001/`, which resolves to `::1` first in that image:

```
wget: can't connect to remote host: Connection refused
```

The site was served correctly the whole time — `127.0.0.1` answered, `localhost`
did not. Fixed by pointing both health checks (compose and Dockerfile) at
`127.0.0.1`. Left alone, `up --wait` fails, and anything that restarts unhealthy
containers flaps the front end forever.

**3. The production database was published on every interface, and collided
with the host's own PostgreSQL.** The compose file published `${DB_PORT}:5432`
with no host address, which puts the production database on every interface the
server has. On this machine a native Windows PostgreSQL already held 5432;
Docker Desktop accepted the binding anyway, and the seed then failed against the
wrong server:

```
error: password authentication failed for user "productivity_prod"
```

Fixed by binding to `127.0.0.1:${DB_PORT}:5432`, which is all the seed, the
backup and `psql` ever needed. The collision itself is not fixable in the
repository — you have to pick a free `DB_PORT`, which is now called out in
`.env.production.example` and in step 1.

**4. `/api` from the admin-web container returned the application's HTML with a
200.** nginx had no `/api` location, so the SPA fallback `try_files ... /index.html`
answered every API call. The Vite dev server proxies `/api` to the backend, so
this worked in development and silently did not in production, and the failure
surfaces as a JSON parse error a long way from its cause. Fixed by adding an
`/api/` proxy to `backend:3000` in `admin-web/nginx.conf`, ahead of the
fallback, with `client_max_body_size 16m` so a 12MB attachment is not rejected
by nginx before the backend can say anything about it. `.env.production.example`
now defaults `VITE_API_URL` to `/api` to match.

**5. `.env.production` was not in `.gitignore`.** Only `.env` and
`.env.production.local` were. The README tells you to create `.env.production`
at the repository root and fill it with the database password and both JWT
secrets — and it was one `git add .` from being committed. Fixed.

### What was already right

The 26 migrations applied cleanly on a fresh database and produced the full
21-table schema. The seed, the API smoke, the attachment upload and download,
the backup container and a restore from its output all worked without changes
once the five defects above were out of the way. The Node 18 problem was the
only one that stopped anything; the other four were things that would have been
found at the worst possible moment.

### Known rough edges, not fixed

- `npm run attachments:check` cannot be run against a containerised `local`
  store without the mounts in step 7, and run naively it reports a false
  catastrophe. Fixing that properly means shipping the scripts in the production
  image or compiling the check into `dist`, which is more than a deployment
  change; step 7 documents the working command instead.
- `docs/POSTGRES_BACKUP_RESTORE.md` documents `pg_dump -Fc` / `pg_restore`
  while the backup container writes gzipped plain SQL. Both restore paths are
  correct for their own format; step 9 has the one that matches the container.
- The `monitoring` and `cache` profiles were not exercised on this run.
