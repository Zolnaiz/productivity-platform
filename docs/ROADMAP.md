# Roadmap

## Ready After PostgreSQL Starts

- Run `npm run db:up` in `backend`.
- Run `npm run migration:run`.
- Run `npm run seed`.
- Start the backend with `npm run start:prod`.
- Run `npm run smoke:api`.
- Open the frontend and test real API mode with a smoke token.

## Next Backend Work

- Replace smoke-token workflow with full login/register support for the operations platform.
- Add user and organization tables for the new operations API, or clearly connect the operations module to the existing auth schema.
- Add API tests for create/update endpoints once PostgreSQL runtime smoke is available.

## Next Frontend Work

- Add real API smoke automation for browser-driven dashboard loading.
- Improve empty/error/loading states across remaining secondary pages.
- Add mobile viewport visual QA for dashboard, sidebar, kanban, reports, and audit templates.
- Add export tests for monthly summaries.

## Recently Completed Hardening

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

## Production Readiness

- Configure real deployment secrets: `JWT_SECRET`, database credentials, and CORS origins.
- Replace localStorage token storage with an HttpOnly cookie/session strategy if the platform will handle sensitive production data.
- Decide whether Docker is backend-only or should include a production admin-web container.
- Add observability: structured logs, request IDs, and error reporting.
- Add Redis-backed distributed rate limiting if the API runs on multiple backend instances.

## Known Constraints

- Docker Desktop/PostgreSQL was not running during local runtime smoke attempts.
- Root Docker compose has been validated with `docker compose config`, but image build/run still needs Docker daemon.
- Existing mobile-flutter workspace has not been integrated into the current verification flow.
