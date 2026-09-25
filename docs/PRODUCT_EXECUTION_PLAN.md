# Productivity Platform Execution Plan

## Estimate

Assumption: one developer working full time, using the existing web, backend,
and Flutter code. These are engineering estimates; they do not include waiting
for organizational access, deployment credentials, or participant availability.

| Phase                         | Scope                                                                                                                                        |  Estimate | Exit condition                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------------- |
| 1. Trust the records          | Fix work-log ownership, prevent duplicate hours, correct organization and per-person report totals, and define who can see employee notes.   |  3–5 days | A worker cannot write for another user; one submitted log produces one set of hours; report totals reconcile. |
| 2. Daily employee workflow    | Add project/task linking, daily work log and goal flows to mobile, validation, save/retry feedback, and offline queueing where needed.       | 1–2 weeks | An employee can complete and record a normal workday from phone and web.                                      |
| 3. Manager execution view     | Add project milestones, action owners, due dates, dependencies/blockers, and a live activity view with assignment and overdue notifications. | 1–2 weeks | A manager can assign and follow a project without manually refreshing several pages.                          |
| 4. Period reports and archive | Add reviewed monthly reports, half-year/year rollups, approved snapshots, exports, and searchable history with retention rules.              | 1–2 weeks | A historical report can be regenerated consistently and its approved copy can be retrieved.                   |
| 5. Deploy and evaluate        | Deploy to a test organization, onboard a small group, resolve field feedback, and compare baseline and post-use measures.                    | 1–2 weeks | The app runs in the target environment and the thesis has measured evidence of its effect.                    |

**Estimated engineering path: 6–9 weeks.** Preparing the thesis narrative,
diagrams, and evaluation write-up can proceed alongside implementation and may
take another 1–2 weeks depending on the university requirements. A smaller
defensible MVP that includes phases 1, 2, and a limited pilot is about 3–5 weeks.

## Execution status — 2026-09-25

Phase 1 is in progress on `codex/productivity-core-integrity`. The first code
pass secures task and work-record ownership, pairs a daily log and its time
entry in one database transaction, prevents linked hours from being counted
twice, and adds organization/per-person daily-goal figures to monthly reports.
The migration has been added but has not been applied. Build and test
verification remain before this phase can be considered complete.

## Product principles

- Treat the authenticated user and organization as the source of record ownership.
- Keep work narrative and measured time linked so a report cannot count the same work twice.
- Make each KPI traceable to the records and date rules that produced it.
- Keep employee transparency purposeful: workers see their own records; managers see team records according to role.
- Describe productivity as measurable outcomes and flow, not as hours or activity volume alone.
- Prefer a small set of complete daily workflows over adding disconnected modules.

## Current review priorities

1. Secure attribution for work logs and time entries; do not accept a caller-selected user as the author.
2. Link the work-log/time-entry pair and calculate hours once.
3. Make organization report goals include the intended people and show per-person totals.
4. Confirm whether ordinary employees may read all colleagues' work logs and reports; make the policy explicit in API permissions.
5. Connect a daily entry to a project or task and expose that flow on mobile.
6. Add a live manager view and explicitly define its refresh/update delay.
7. Add report period selection, approval, immutable archived copies, and half-year/year summaries.
8. Pilot the system and measure before/after time-to-report, on-time completion, overdue work, 5S audit score, and employee adoption.

## Risks and dependencies

- Incorrect ownership or duplicated time undermines trust in every later report; phase 1 blocks KPI work.
- “Live” requires an explicit freshness target and a delivery mechanism (for example server-sent events or polling); a page that fetches once is not live monitoring.
- Archival requires a policy for corrections, retention, account deactivation, and exports before implementation.
- A productivity claim needs a baseline and comparable observation period; feature completion alone does not demonstrate a productivity increase.
- Production deployment and a pilot depend on access to the target environment and people who can evaluate the workflow.
