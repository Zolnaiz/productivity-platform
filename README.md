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

This runs backend tests, the migration check against a real PostgreSQL, backend lint/build/audit, and frontend tests/lint/build/audit.

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
- [Architecture Decisions](docs/DECISIONS.md)
- [UI Guidelines](docs/UI_GUIDELINES.md)
- [Roadmap](docs/ROADMAP.md)

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

- Every migration is applied to a real PostgreSQL on each verification run and the resulting schema is inspected: every live table present, every mapped column present, the schema writable, and the partial unique index behind one-task-per-finding actually refusing a second. PGlite runs PostgreSQL in process, so this needs no Docker, daemon or virtualisation.
- Production requires `JWT_SECRET`.
- Production rejects known weak JWT and refresh-token secrets.
- Production rejects `DB_SYNCHRONIZE=true`.
- Swagger is disabled in production unless `ENABLE_SWAGGER=true`.
- Public operations access is disabled by default.
- Operations API data is scoped by `organizationId`.
- Joining an organization requires an invitation issued for that address; tokens are 32 random bytes, stored only as a SHA-256 hash, single-use, and expire after 14 days.
- Roles and permissions come from one table (`backend/src/shared/roles.ts`). Nobody can assign their own role or above it, so no API path produces a second super admin; an invitation cannot grant a role its sender could not assign; and changing somebody's role requires that their current role is one the caller could have granted.
- Every operations and user route names the permission it needs, and `PermissionsGuard` refuses the request when the caller's role does not carry it. A viewer can read the plant and cannot change it. A test walks the controllers and fails when a route names no permission, or names one the table does not define.
- Editing a member cannot change their role, organization, active flag or password. Each of those has its own route with its own check; sending one to the edit endpoint is rejected rather than silently dropped.
- The client asks `GET /users/profile/permissions` to decide which controls to draw, and is answered from the same table the server enforces with.
- The users and operations APIs are tested over real HTTP through the same pipes, guards and filters `main.ts` configures, so the refusals are checked as a client meets them rather than as guards built by hand. Removing a route's permission, or putting a privilege field back into the edit DTO, each fail those tests.
- The team screen reads the real users API rather than browser storage, and adding somebody is an invitation rather than a create: the token is shown once, open invitations are listed, and the role select offers only roles the signed-in person may actually grant.
- The workspace screen reads and writes the real organization record. The API takes the organization from the caller's token, so there is no id to pass and no path to another tenant's record; `isActive` and `features` are not editable by the tenant.
- Headcount is counted from the members the users API returns rather than stored, so it cannot disagree with who can sign in.
- The audit trail is written by the server. An interceptor in front of every route records each accepted change — actor, role, module, action, target, method, route, status — taken from the verified token and the route rather than from any request body, so a client cannot write its own history. Reads are not recorded, refused requests are not recorded, and the table is append-only: there is no route that writes, edits or removes an entry.
- Failing to write an audit entry never fails the request it describes; the gap is logged instead.
- Client route guards name the permission the server checks rather than a role list of their own. Those lists had drifted in both directions: an `admin` could open the workspace settings and then be refused the save, while an `organization_admin` was locked out of an audit log the server would have served. The guard fails open when the permission list is unavailable, because it exists to avoid offering an unusable page — the server is the boundary.
- Departments are still kept in the browser only, and that screen says so rather than presenting a local list as a shared record.
- Right-clicking the plan opens a menu of what applies to whatever is under the pointer, with the stacking actions live only for a drawn object and paste live only once something has been copied. Overlapping objects are reordered from it: SVG draws in array order, so the array is the stacking order and no `zIndex` column exists to fall out of step with it.
- Areas are copied with Ctrl+C/Ctrl+V or duplicated with Ctrl+D, singly or a whole selection at a time. A copy keeps how the area is set up and inherits none of what happened in it: no audit score, no last-audit or last-cleaned date, no red tags. Each copy gets its own code, because two areas sharing one on a printed label sheet is a real problem on a shop floor.
- A new workspace is asked how to begin — trace a drawing it already has, start from a named shell at real dimensions, or draw from scratch — rather than being handed a pre-drawn sample office. An empty plan used to be silently replaced with one, so somebody signing up saw a building that was not theirs with areas named Reception and Workstations, and their first job was working out that none of it was real. A template is walls and nothing else, and the screen says so.
- Doors and windows are cut into the walls rather than drawn over them: an
  opening belongs to a wall and is measured along it, the wall renders as the
  pieces left standing either side, and a door leaf shows the quarter circle it
  sweeps — which is how anybody reading the plan knows the square metre in
  front of it is not floor you can stack a pallet on.
- Everything placed on the plan is the size it really is: a desk 1.6 by 0.8 m,
  a EUR-1 pallet 1.2 by 0.8, a racking bay 2.7 by 1.1. The palette says so on
  each button, the panel takes metres rather than canvas units, and things that
  stand against walls go flush and square to the wall they are dragged to. The
  palette no longer offers a "wall" or a "door" of its own — those were
  rectangles that looked like a building and enclosed nothing.
- Corners are handles. Dragging one moves every wall that ends on it — and the
  rooms, areas and doors that depend on those walls follow — and dropping one
  corner on another joins them into a single point, which is how a room that
  never quite closed gets closed.
- Rooms can be named. A room is not stored — it is whatever the walls close in
  — so its name is a point with words on it, and the room it names is whichever
  room that point falls inside. Move a wall and the name stays in the room;
  knock the room through and the name is left standing where it was, which is
  what has actually happened.
- Grid, snapping and dimensions are three separate switches. One checkbox
  called "Grid" used to answer all three questions, so turning the grid off to
  look at the plan also turned snapping off without saying so.
- A 5S area now knows where it is. The panel says which room it is in, what it
  measures, what share of that room it covers, and how many red tags that is
  per 100 m² — the number that makes two areas comparable, since two tags in a
  6 m² tool crib and two in a 600 m² hall are not the same finding. An area
  drawn across a wall is called out, because nobody can walk, audit or own it
  as one area.
- Each room says what it adds up to: how much of its floor is mapped into 5S
  areas at all, how those areas score on average, how many open red tags that
  is and how many per 100 m². Areas that are in no room are listed rather than
  dropped from every total.
- A project reports what its tasks say, not what somebody dragged a slider to:
  how many tasks are done, open, in progress and overdue, the hours recorded
  against it from both places people record them, and whether it is past its
  own due date. The slider survives only for a project with no tasks yet, and
  says it is an estimate.
- The monthly report is compiled person by person, from the tasks, hours, work
  logs, audits and assessments each of them recorded. Somebody who recorded
  nothing still gets a line, because a month with nothing in it is a fact about
  the month; somebody who has since left keeps theirs, because they still did
  the work.
- The plan has a night of its own. It used to be a sheet of pure white with
  black walls whatever the rest of the page was doing, so turning the lights
  off left one blazing rectangle in the part of the screen people look at
  longest. Now the paper goes dark and the ink goes light, hues that carry
  meaning keep their hue, and anything exported or printed is forced back to
  the daylight set — a plan leaving the editor is going onto white paper.
- The 5S page speaks the reader's language throughout. It had about 120 English
  strings hardcoded into it — every table header, every button, every message,
  and the sentences the rules module built to say what an area still needs — so
  a Mongolian workspace read most of its biggest page in English. What an area
  needs is now produced as a key and its numbers rather than as a finished
  English sentence; the English wording is kept for exports, because a CSV goes
  to somebody who may not share the reader's language.
- Work raised for somebody is delivered to them. A notification is addressed to
  one person, carries the task's own words, links to where the work is, and is
  read once — the scheduler re-raises the same due audit every morning until it
  is done, and that reaches its owner once rather than daily. The navigation
  carries the unread count, because a notification that has to be gone looking
  for is the list it replaced.
- The audit trail records what changed, not only that something did — the
  fields a request asked to change and what it asked to set them to, with a
  field whose name says it is a secret keeping its name and losing its value,
  and anything too large to read described rather than copied. It is the change
  that was *asked for*: an interceptor never sees the row as it stood, and the
  trail does not pretend otherwise. Entries are kept two years by default.
- A building has as many plans as it has floors. Each carries a site, a floor
  and a name; the editor moves between them, and an audit of a zone upstairs
  repaints upstairs — which it could not have done while the lookups took the
  organization's first plan.
- The plan is drawn as walls, not rectangles. Walls meet at shared corners, snap to the nearest 45 degrees unless Alt is held, and show their length in metres while being drawn. A room is whatever the walls close in — found from the wall graph on every change rather than stored, so a room and its walls cannot part company — and its area is a consequence of the drawing rather than a number somebody typed.
- Several areas can be worked on at once: shift-click or drag a rubber band to select, move or delete them together, and line them up or space them evenly. The group is clamped as one shape, so hitting an edge does not squash the arrangement.
- The floor plan zooms and pans: wheel or trackpad pinch to zoom at the pointer, space or middle-drag to pan, a zoom readout with fit and zoom-to-area. Every drag measures the pointer through the current view, so editing works the same at any zoom.
- The rules a 5S area is judged by — stage gates, what an area still needs, which areas a filter shows, what a task raised from an area says — live in `floorPlanRules.ts` and are tested directly rather than only through the floor plan that draws them.
- Submitting an audit run writes its score onto the referenced 5S zone, so the area map shows measured condition rather than chosen colours.
- Tasks raised from a 5S finding record their source, and the API raises at most one open task per finding rather than duplicating work.
- Attachment uploads are typed by sniffing their bytes, stored under a server-generated key, served with `Content-Disposition: attachment` and a sandboxing CSP, and scoped by `organizationId` on every read. Clients fetch them through the authenticated API rather than linking the guarded endpoint.
- Operations updates preserve the original organization scope and ignore payload attempts to move records across organizations.
- Operations API supports scoped project soft-delete and the runtime smoke cleans up its write test project.
- Runtime PostgreSQL smoke uses a seeded organization/user and validates real `/auth/login` JWT flow before exercising operations writes.
- Backend API has global rate limiting configured by `RATE_LIMIT_TTL_MS` and `RATE_LIMIT_LIMIT`.
- Frontend API requests include `X-Request-Id`; backend logs and responses expose the same ID for correlation.
- Backend logs redact sensitive payload fields.
- Backend unexpected errors return a generic client message while detailed exception data stays in logs.
- Backend error responses carry a stable `errorCode` so clients can report failures in the user's own language; the frontend translates it and never displays the API's English text.
- A 401 from an auth endpoint is reported to the caller rather than treated as an expired session, so a rejected sign-in explains itself instead of reloading the page.
- A daily job raises the 5S audits each zone's declared frequency calls for; `ENABLE_AUDIT_SCHEDULER=false` turns it off.
- Backend exposes Prometheus-compatible metrics at `/api/metrics` only when `ENABLE_METRICS=true`.
- Unused Socket.IO dependencies were removed and backend `js-yaml` is pinned through overrides to keep dependency audits clean.
- PostgreSQL backup/restore guidance is documented for Docker and non-Docker environments.
- Light, dark and follow-the-system are switchable from the header, and so is Mongolian or English. Both capabilities were complete and unreachable: the theme context has supported all three modes from the start with every component styled for them, and the language switch was buried in Settings — which somebody who cannot read the current language has to find first.
- Frontend admin routes are role-guarded (`admin`/`super_admin`; audit log is `super_admin` only).
- Frontend production mode does not silently fall back to demo data for real backend failures.
- Frontend demo mode is disabled in production unless `VITE_ENABLE_DEMO_MODE=true`.
- Frontend API calls clear stale `demo-token` auth data instead of sending it in production.
- Frontend operations mutations strip client-owned `id` and `organizationId` before real backend calls.
- Frontend demo/local storage data recovers from corrupted browser storage instead of crashing the app.
- Frontend module pages use explicit loading and empty states for operations, admin, people, quality, reports, and personal-productivity flows.
- Charts expose their figures as a table, so the values are available to screen readers and to anyone who prefers to read them.
- Production Docker config validates required secrets before startup and includes the `admin-web` static container.
- Auth responses are normalized between backend JWT contracts and frontend role guards.
- JWT lifetime and refresh secret settings are read through validated backend configuration.

## Current Verification Status

- Backend tests: 517 passing
- Frontend tests: 691 passing
- Mobile tests: 40 passing
- Mobile `flutter analyze`: no issues
- Backend lint/build/audit passing
- Frontend lint/build/audit passing
- Runtime smoke passing against a native PostgreSQL 18 install: seeded owner login, project create/update/delete, and auth refused without a token
- Audit trail verified against that database: the three writes the smoke makes leave three rows with the actor taken from the token, the deletion marked as a warning, and no rows at all for the reads
- Playwright browser smoke passing for seeded owner login and Projects page load
