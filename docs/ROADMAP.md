# Roadmap

## What comes next, in order

Written 2026-09-18, after the floor plan became a floor-plan tool and the
projects and monthly report stopped reporting numbers nobody measured. The
order is by what blocks the next thing, not by what is most interesting.

### 1. Ship what is built

Nothing below matters if it only exists on a branch and on one laptop.

- **Merge `feat/design-system-adoption` into `main`.** It is 70 commits ahead.
  CI runs on pull requests and on `main`, so every one of those commits has
  been verified locally and by nothing else. This is one pull request and it
  should happen before the branch grows again.
- **Deploy to MPC for real.** Postgres, the migrations, the environment, and a
  first organization. The pieces exist — Dockerfiles, compose files, a backup
  and restore runbook — and have never been run end to end by anyone but the
  author.
- **Give attachments a real file store.** They write to `UPLOAD_DIR` on local
  disk, which does not survive a container being replaced. Photographs are
  evidence in a 5S programme; losing them on a redeploy is losing the evidence.

### 2. Make it trustworthy in daily use

Each of these is something the product currently does half of, in a way a
person notices within a week of real use.

- **Departments.** The last browser-local module, and the page admits it. The
  question to answer first is not how to store a name — it is whether a
  department owns zones, projects, or the people assigned to them. Until that
  is decided the table cannot be designed.
- **Tell somebody, outside the application too.** Work raised for somebody now
  reaches their inbox inside the product; what is still missing is a transport
  that reaches them when they are not looking at it, and invitations have the
  same hole — the API issues a token and the inviter sends it by hand. One
  transport serves both.
- **The audit trail's remaining half.** It now records what a request asked to
  change and keeps entries two years. What it still cannot say is what a value
  was *before*, because an interceptor sees the request and the response and
  never the row as it stood. Doing that means reading the record before the
  write, on the routes where it is worth the cost.

### 3. 5S where the building is real

The floor plan can now carry these; before the walls existed, none of them
could be built honestly.

- **Multi-floor is in; multi-site is half.** An organization has a plan per
  floor, each with a site, a floor and a name, and the editor moves between
  them. What is still a flat list is the reporting above them: the room
  register and the monthly report do not group by site, so a plant with two
  buildings reads as one.
- **A QR code per zone is in**, opening a phone-first page for that area. What
  it does not yet do is let somebody *act* from there: record an audit answer,
  raise a red tag, or mark the area cleaned. That is the step that turns it
  from a notice board into a tool, and it needs a form somebody can fill in
  with one hand.
- **Routes measured in metres.** The plan knows its scale and its rooms, so a
  spaghetti diagram is now arithmetic rather than a drawing exercise.
- **Floor plan versions.** An audit from March should still make sense against
  the plan of March, not against the wall somebody moved in June.
- **Audit layers in the interface.** They are read from the layout and default
  sensibly; nothing lets an organization change them, or assign a layer by role
  rather than to the zone owner.

### 4. Language and content

- **Task titles are built on the server, in English.** The scheduler writes
  "Tier 1 5S audit due: A03 - Storage" and that is what the task, the register
  and now the notification all say, whatever language the reader is in. It is
  the same fault the 5S page had — a sentence assembled where it cannot be
  translated — and the same fix: a key and its parts, worded where somebody is
  reading.

- **The translation is finished for the pages people use daily.** What is left
  is the pages nobody has needed in Mongolian yet — the platform placeholders
  and a few admin screens — and the strings the server builds, which is the
  task-title item above.
- **Move the guideline registers out of the source.** About a hundred Mongolian
  strings sit in `FiveSGuidelineRegisters.tsx`. They are not UI copy — they are
  one organization's 5S standard — so they belong in seeded organization data,
  which also lets a second organization have its own.

### 5. Mobile

- Build the Phase 1 screens against the real API: login, my tasks, calendar,
  work log, clock in and out. The Flutter app compiles and its logic is tested;
  its screens have never spoken to the server.
- Cover `auth_provider` first, since login is the path every user takes.

### 6. Dependencies

- **NestJS 11 to 12.** The seven `multer` advisories that made the backend's
  `npm audit` red are fixed by forcing a patched multer through an override,
  which is the actual fix: the code that runs is the patched one. What it is
  not is the upgrade — `@nestjs/platform-express` still pins 2.2.0, and the
  override is the reason that does not matter. Moving the framework itself is
  a deliberate piece of work rather than something to fold into an unrelated
  change.

### 7. Keep it honest as it grows

- **A browser-driven smoke run in CI**: sign in, load the dashboard, open the
  5S page, draw a wall. Every serious defect found in the last month — the
  pointer mapping, the walls that were never saved, the white canvas — was
  found by opening the application, not by a unit test.
- **Visual regression screenshots** for the pages that are now designed rather
  than assembled.

## Next Backend Work

- Decide what a department owns before giving it a table. The Users screen is
  on the real API now; Departments is still browser-local and says so on the
  page. The question is not how to store a name and a manager — it is whether
  a department owns zones, projects, or the people assigned to them.
- Give the audit trail a retention policy. Every accepted change writes a row
  and nothing removes one, which is correct for evidence and unbounded for a
  database. Decide how long entries are kept, and whether they are archived
  rather than deleted.
- Record what changed, not only that something did. An entry names the actor,
  the route and the record; it does not carry a before and after. That is a
  deliberate first step — a diff has to be taken without putting a password or
  a token into a table people read — but it is the next thing a reader wants.
- Bring back the automation settings when there is automation behind them:
  monthly report preparation, notifying a manager about an overdue task,
  notifying the quality team below 85%, and work-log approval. All four were
  switches that were read by nothing, so they were removed rather than left
  looking functional.
- Deliver invitations. The API issues the token and the inviter shares it by
  hand; there is no email transport.
- Add browser-driven API smoke automation for login, dashboard load, and core module navigation.
- Decide whether runtime auth tables should remain as dedicated operations-platform migrations or be merged into the legacy initial migration set before first production deployment.
- Seeded demo content is still written in one language in the source. Unlike
  error messages, this is organization data rather than UI copy, so it belongs
  in the seed per organization rather than in the locale files.

## Next 5S Work

- Let an organization edit its audit layers. The tiers are read from the layout
  and default sensibly, but nothing in the interface changes them yet.
- Assign a layered audit by role rather than to the zone owner. Needs the users
  API.
- A printable QR code per zone, so scanning the zone label on a phone opens
  that zone's checklist. This is what turns the mobile app into a tool.
- Multi-floor and multi-site. `site` is a single string; real organizations
  have buildings and floors.
- Scale calibration for an imported blueprint, so drawn zones carry real
  dimensions.
- Floor plan versions, so an old audit still makes sense against the map of its
  time.
- Raise tasks from the improvement register too. Red tags and audits are linked
  now; an improvement record's action plan is still free text.
- Record the disposition when a tag is closed. `closedAt` is set automatically;
  whether the item was disposed of or returned still has to be filed by hand,
  and nothing prompts for it.
- Attach photographs to audit answers too. Red tags and zone standards carry
  them now; a failed checklist item still cannot show what was wrong.
- Give production a real file store. Attachments write to `UPLOAD_DIR` on local
  disk, which does not survive a container being replaced.
- Tell somebody when an audit is raised. The scheduler creates the work; nobody
  is notified, so it is still found rather than delivered.

## Next Frontend Work

- The floor plan is now a 2D floor-plan tool: walls that close into rooms with
  real areas, doors and windows cut into those walls, an object catalogue at
  real dimensions, draggable corners, named rooms, and grid/snap/dimensions
  switches. What is left is putting 5S on top of it — zones that sit inside a
  real room rather than floating in an abstract canvas, and scoring and red
  tags read per square metre of the room they are in. Doors and windows are in: an opening belongs to a wall and
  is measured along it, the wall renders as the pieces left standing, and a
  door carries the quarter circle its leaf sweeps. So is the object catalogue:
  real dimensions in metres, shown on the palette, with wall snapping for the
  things that stand against walls. So is dragging a corner, including dropping
  one corner on another to join them.

- Finish the floor-plan editor. Zoom, pan, grid snap, corner resize,
  undo/redo, keyboard editing, multi-select, align/distribute and
  copy/paste/duplicate, z-order and a right-click menu are in. Still missing,
  in the order they are missed: an explicit tool palette, rulers
  with real-world scale calibration, and lock/hide per item. Multi-select
  covers zones only — objects are still one at a time.

- Add visual regression screenshots for the polished module pages.
- Move the 5S guideline register content out of `FiveSGuidelineRegisters.tsx`.
  Roughly a hundred Mongolian strings are hardcoded there. They are not UI copy
  — they are one organization's 5S standard — so they belong in seeded
  organization data, which also lets a second organization have its own.

## Next Mobile Work

- Run `powershell -ExecutionPolicy Bypass -File .\scripts\mobile-verify.ps1`
  after each change; it runs analyze and the tests, and both are clean as of
  2026-09-02.
- Extend the mobile tests past the pure logic. Providers, the API service and
  the screens have no coverage; `auth_provider` is the next one worth having,
  since login is the path every user takes.
- Build Phase 1 screens against the real API: login, my tasks, calendar, work
  log, clock in/out.

## Recently Completed Hardening

- Deleted the scaffolding: four backend modules outside the application graph,
  five frontend services with no importers, the legacy shared entities and the
  unused seed module — 8,163 lines that compiled, linted and were reached by
  nothing. The backend package is no longer called `questionnaire-backend`.
- Added layered process audits: each layer runs on its own clock, the zone panel
  reports every layer separately, and the daily job raises one task per layer
  that is due. See [DECISIONS.md](DECISIONS.md).
- Built the red-tag holding area: tagged items wait 30 days with a clock, a
  panel lists what is waiting most-urgent-first, and the daily job chases a
  decision once a hold runs out. The wait is what makes red-tagging evidence
  rather than opinion. See [DECISIONS.md](DECISIONS.md).
- Gave red tags a position on the floor plan. A tag is now a numbered pin
  inside its zone, draggable but clamped to that zone — "the pallet by the north
  door" is a different finding from "the pallet by the bench".
- Stopped an edit to a red tag wiping the `closedAt` set when its cleanup task
  was finished. `closedAt` now changes only when the status itself does.
- Made it possible to form a team: invitations by email and role, accepted into
  the inviting organization. Every registration used to create a brand-new
  organization with no way to add a second person. See [DECISIONS.md](DECISIONS.md).
- Made the audit cycle run itself. A daily job raises the audits each zone's
  declared frequency calls for, deduping against the manual button. `auditFrequency`
  was declared on every zone and read by nothing. See [DECISIONS.md](DECISIONS.md).
- Added a module-graph test. No backend spec had ever exercised dependency
  injection, so a misregistered provider would only have failed at startup.
- Gave every zone an audit history: latest score against a frozen baseline, the
  change between them, open red tags, and the dated scores behind it. Deliberately
  not a chart — a trend line through three audits claims a precision the data
  does not have.
- Mirrored the audit-score rule in the demo workspace, and grouped the demo
  mirrors so the next server rule is not forgotten. See [DECISIONS.md](DECISIONS.md).
- Fixed a crash that took down the whole floor plan the first time a real audit
  scored a zone: audit-cycle date arithmetic could not read the timestamp the
  server writes. It now lives in a tested module.
- Closed the last joint of the 5S loop: finishing a task raised from a red tag
  marks the tag finished, so the map stops reporting a problem somebody already
  fixed. See [DECISIONS.md](DECISIONS.md).
- Gave demo records collision-free ids. Eight services generated ids from
  `Date.now()`, so records created in one pass shared an id and updating one
  rewrote the others.
- Added photo evidence: a before/after pair on every red tag and a standard
  photograph on every zone, with the file's real type read from its bytes and
  every read scoped to one organization. See [DECISIONS.md](DECISIONS.md).
- Linked work back to the finding that caused it. Tasks raised from a red tag or
  an audit carry their source, show it on the kanban card, and the server raises
  at most one open task per finding — the "Red-tag tasks" button used to double
  the work every time it was pressed. See [DECISIONS.md](DECISIONS.md).
- Closed the first joint of the 5S loop: an audit run now references the zone
  it audited, and submitting one writes the score, date and a frozen baseline
  onto that zone server-side. The floor plan can colour zones by audit
  condition, so the map shows measured state rather than chosen colours. See
  [DECISIONS.md](DECISIONS.md).
- Fixed the migration glob, which silently skipped both 5S layout migrations —
  `five_s_layouts` was never created in any real database.
- Gave `mobile-flutter` its first tests (40), covering the validators the login,
  register and profile screens call, the user model's API parsing, and the date
  formatting the profile screen uses. They found two defects, both fixed:
  `validateName` rejected every Cyrillic name, so no Mongolian user could
  complete registration or edit their profile; and `initials` threw a
  `RangeError` on a name with a double or trailing space, or on the empty user
  an empty API response produces, crashing the profile avatar.
- Deleted `mobile-flutter/lib/utils/formatters.dart`. Nothing imported it, and
  it carried credit-card and SSN masking helpers for a product that handles
  neither.
- Gave the charts a table view. The figures are always in the accessibility
  tree, the chart itself is hidden from it, and a toggle switches the visual
  presentation for anyone who would rather read the numbers.
- Confirmed the remaining actions that destroy or withdraw saved work: the two
  5S guideline register tables, and publishing or archiving an assessment
  template. Template status changes also report failure instead of rejecting
  silently. The 5S canvas keeps its one-click delete, because it has undo, and
  removing a question from an unsaved draft stays immediate.
- Gave the API stable error codes and translated them in the browser, so a
  failure is reported in the workspace language instead of English prose. Fixed
  the sign-in path, which reported "check that the backend API is running" for
  every failure including a wrong password. See [DECISIONS.md](DECISIONS.md).
- Stopped treating a 401 from `/auth/login` as an expired session. The refresh
  interceptor redirected to `/login`, reloading the page and discarding the
  error message before it could be read.
- Added Mongolian and English translations behind the workspace language
  setting, which previously announced a change it could not make. Every page
  reads its copy from the locale files. See
  [DECISIONS.md](DECISIONS.md).
- Adopted the shared form, table, dialog and loading components across every
  page, removing 34 copies of the same field class string; fixed the defects
  this surfaced in `Input`, `Table` and `Loading`.
- Replaced the hand-drawn analytics bars with validated charts, and removed
  three unused chart components that would have shipped an unreadable dark mode.
- Made the 5S floor plan directly editable — grid snap, resize handles, keyboard
  nudge, undo/redo — and coalesced its saves, which had been one write per
  pointer frame.
- Confirmed project deletion, which previously destroyed a project and its
  progress on the first click.
- Removed a 27-entry route table in `App.tsx` whose filter excluded every entry,
  so it rendered nothing.
- Cleaned up `flutter analyze` in `mobile-flutter` (159 findings to zero) and
  stopped tracking Flutter's machine-generated iOS config.
- Added runtime auth/organization migrations aligned with the current backend entities.
- Seeded a real demo organization and owner user for PostgreSQL runtime checks.
- Switched runtime API smoke to log in through `/auth/login` and use the returned JWT for summary and project create/update/delete checks.
- Kept the generated smoke token check as a guard-level regression test.
- Passed Docker PostgreSQL runtime smoke with runtime auth migration, operations migration, seed, backend health, auth-required, login token, smoke-token project listing, summary, and project write checks.
- Added Playwright browser smoke coverage for seeded-owner login and Projects page loading against the real backend.
- Fixed frontend auth response normalization for backend `{ success, data }` envelopes.
- Added `http://127.0.0.1:3001` to local backend CORS defaults for browser testing.
- Added project create/update/delete runtime smoke checks against PostgreSQL and cleanup of the smoke project.
- Added scoped project soft-delete support in backend and frontend service/UI.
- Removed unused Socket.IO dependencies from backend/frontend and pinned backend `js-yaml` to a patched version through npm overrides.
- Added mobile Flutter verification script and optional root `verify.ps1 -IncludeMobile` flow.
- Prepared the Flutter workspace with required asset directories and optional environment loading.
- Added a production `admin-web` Dockerfile and nginx config for static Vite serving.
- Modernized `docker-compose.prod.yml` to use the backend's real environment names and required production secrets.
- Moved optional cache, backup, and monitoring services into production compose profiles.
- Added `.env.production.example` and validated production compose default/cache/backup/monitoring config.
- Added a Prometheus-compatible backend `/api/metrics` endpoint and request metrics interceptor.
- Wired the production monitoring profile to scrape backend metrics.
- Made backend metrics opt-in with `ENABLE_METRICS=true` and regression coverage.
- Added frontend API-layer protection that clears stale demo auth data instead of sending `demo-token` in production.
- Hardened operations update paths so payloads cannot move existing records across organizations.
- Reordered specific backend routes before dynamic `:id` routes to prevent route shadowing.
- Aligned auth refresh responses with login/register by returning renewed tokens plus user data.
- Fixed auth `expires_in` so it reflects `JWT_EXPIRES_IN` instead of a hard-coded refresh-token lifetime.
- Added production Docker Compose config validation to local verify and CI.
- Hardened frontend operations mutations so client-owned IDs and organization scope are not sent to real backend writes.
- Added validation decorators and DTO-based controller handling for forgot/reset/change-password auth flows.
- Added DTO validation classes for operations create/update endpoints.
- Added nested validation for checklist questions and audit/assessment answers.
- Added controller regression tests for date-string to `Date` payload normalization.
- Added backend monthly report filtering by requested `YYYY-MM` period.
- Added frontend monthly report service coverage for real backend query params and demo report fallback.
- Connected the Monthly Report page to the backend monthly report contract and added page regression tests.
- Added Monthly Report month-selector regression coverage.
- Added UUID validation and foreign keys for operations cross-reference IDs.
- Added frontend role guards for admin routes and `super_admin`-only audit log access.
- Added ProtectedRoute tests for unauthenticated, role-denied, and role-allowed flows.
- Added LoginPage tests for demo workspace visibility and navigation.
- Added loading, error, and empty states to Projects, Tasks/Kanban, and Work Logs pages.
- Added loading and error states to Dashboard and Monthly Report pages.
- Added Dashboard component tests for loading and backend error states.
- Added frontend service regression coverage so optimistic client IDs are not sent to real backend create endpoints.
- Added loading, error, and empty states to 5S / Audit Templates page.
- Added production demo-mode guard so `demo-token` is ignored unless demo mode is explicitly enabled.
- Fixed auth service/controller contract mismatches for login, register, refresh, profile, and frontend role normalization.
- Registered a lightweight AuthModule in the backend app graph without pulling legacy user/organization controllers into the current build.
- Added backend AuthService tests and frontend auth response normalization tests.
- Added frontend token response normalization tests for `token` and `access_token` contracts.
- Added frontend registration payload mapping coverage for backend register DTO compatibility.
- Replaced the public `/register` placeholder with a working registration page and page tests.
- Added global backend rate limiting with validated environment configuration.
- Added request ID correlation and structured backend HTTP logs with sensitive payload redaction.
- Added PostgreSQL backup/restore guidance and ignored local backup artifacts.
- Aligned JWT expiration environment names across `.env.example`, AuthModule, and AuthService.
- Moved AuthService JWT lifetime and refresh secret reads onto validated `ConfigService` values.
- Added a Docker daemon preflight to the runtime smoke helper.
- Added AuthController contract tests for login, register, refresh, profile aliases, logout, and password changes.
- Added dedicated UsersService password-change flow and tests so auth password updates avoid unrelated role-access paths.
- Added backend `admin` role compatibility in UsersService organization access and permission helpers.
- Added verification scripts, CI workflow, Docker compose config validation, and dependency audit checks.
- Added a reusable frontend `EmptyState` component.
- Added loading and empty states across personal productivity, admin, analytics, people, finance, questionnaire, and response pages.
- Hardened frontend demo storage, auth storage, app config storage, theme storage, and the shared `useLocalStorage` hook against corrupted browser storage.
- Added frontend regression tests for corrupted storage recovery across contexts, hooks, and demo services.
- Hardened the backend global exception filter so unexpected server errors do not leak internal messages to clients.
- Added request ID propagation in backend error responses for easier support/debugging.
- Added frontend request ID generation so browser API calls can be correlated with backend logs.
- Hardened production environment validation for explicitly configured JWT refresh secrets.
- Removed unused legacy dashboard/users/reports page scaffolds after replacing them with operations-platform pages.
- Added export and clipboard-copy regression tests for monthly summaries.

## Production Readiness

- Configure real deployment secrets: `JWT_SECRET`, database credentials, and CORS origins.
- Replace localStorage token storage with an HttpOnly cookie/session strategy if the platform will handle sensitive production data.
- Add production error reporting and alerting for observability.
- Add Redis-backed distributed rate limiting if the API runs on multiple backend instances.

## Known Constraints

- Docker cannot start on the development machine: virtualisation is disabled
  in firmware and enabling it in the ASUS PRIME H310M-F BIOS has not taken.
  Nothing depends on it any more. `npm run migration:check` applies every
  migration to PostgreSQL compiled to WebAssembly, in process, and the runtime
  smoke runs against a native PostgreSQL 18 install — both verified passing on
  2026-09-16.
- Root Docker compose and production profile configs have been validated with `docker compose config`, but image build/run still needs Docker daemon.
- Flutter CLI is not installed on PATH yet, so mobile `flutter analyze` / test checks cannot run until SDK setup finishes.
