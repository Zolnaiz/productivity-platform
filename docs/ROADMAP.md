# Roadmap

## Next Backend Work

- Add browser-driven API smoke automation for login, dashboard load, and core module navigation.
- Decide whether runtime auth tables should remain as dedicated operations-platform migrations or be merged into the legacy initial migration set before first production deployment.
- Decide what to do with the legacy modules. `expenses`, `reports`,
  `questionnaires` and `shared/pipes/validation.pipe.ts` are not in the
  application graph and ship nothing, but they hold most of the repository's
  untranslated strings and read as live code. Wire them up or delete them.
- Seeded demo content is still written in one language in the source. Unlike
  error messages, this is organization data rather than UI copy, so it belongs
  in the seed per organization rather than in the locale files.

## Next Frontend Work

- Add visual regression screenshots for the polished module pages.
- Give the charts a table view. Values are directly labelled today, so nothing is
  hover-only, but a table twin is still the accessible equivalent for a reader
  who cannot use the chart at all.
- Move the 5S guideline register content out of `FiveSGuidelineRegisters.tsx`.
  Roughly a hundred Mongolian strings are hardcoded there. They are not UI copy
  — they are one organization's 5S standard — so they belong in seeded
  organization data, which also lets a second organization have its own.

## Next Mobile Work

- Run `powershell -ExecutionPolicy Bypass -File .\scripts\mobile-verify.ps1`
  after each change; `flutter analyze` is clean as of 2026-09-01.
- Add the first Flutter tests. `mobile-flutter` has no test directory, so the
  mobile workspace is the only one of the three without coverage.
- Build Phase 1 screens against the real API: login, my tasks, calendar, work
  log, clock in/out.

## Recently Completed Hardening

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

- Docker Desktop/PostgreSQL runtime smoke is now passing locally.
- Root Docker compose and production profile configs have been validated with `docker compose config`, but image build/run still needs Docker daemon.
- Flutter CLI is not installed on PATH yet, so mobile `flutter analyze` / test checks cannot run until SDK setup finishes.
