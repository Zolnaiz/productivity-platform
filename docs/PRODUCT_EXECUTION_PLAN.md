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

## Execution status — 2026-09-30

The code is on `codex/productivity-core-integrity`. Treat the estimates above as
the original planning baseline, not as a statement that all five phases remain
unimplemented. The audit in `PRODUCT_AUDIT_REPORT_2026-09-29.md` records the state
before the daily-work follow-up described here.

| Phase | Implemented | Still needed |
| --- | --- | --- |
| 1. Trust the records | Authenticated authorship, transactionally paired log/time entry, single-count report totals, organization/per-person goals, tenant-scoped project/task lookup and matching links | Review legacy unlinked hours before importing pilot records; confirm department-manager visibility policy with the pilot organization |
| 2. Daily employee workflow | Web and Flutter project/task selection (including completed tasks), blockers, failure-preserved drafts, Flutter offline queued linkage | Full offline read cache, server retry idempotency and queued evidence uploads |
| 3. Manager execution view | Task assignment, due dates, live progress board, inbox and reminder infrastructure | Milestones, dependencies and verification of corrective actions |
| 4. Period reports and archive | Monthly close snapshots, reopen permissions, period rollups and exports | Required correction reasons, approval policy and retention agreement for the pilot |
| 5. Deploy and evaluate | Docker deployment files and isolated live verification runner | Target organization's deployment, mail/file-store setup, user onboarding and measured before/after pilot |

The daily-work flow now keeps a task's project on both the narrative and its time
entry. A task from another organization, or another worker's task when submitted
by an employee, is rejected. A conflicting task/project pair is rejected before
anything is saved. General work can still be recorded without either link.

Run `scripts/verify-live.ps1 -IncludeMobile` to repeat the real PostgreSQL, API,
browser and Flutter client checks on a fresh disposable database. The current
verification results are kept in the README; local verification is not evidence
of deployment or improved employee productivity.

## Product principles

- Treat the authenticated user and organization as the source of record ownership.
- Keep work narrative and measured time linked so a report cannot count the same work twice.
- Make each KPI traceable to the records and date rules that produced it.
- Keep employee transparency purposeful: workers see their own records; managers see team records according to role.
- Describe productivity as measurable outcomes and flow, not as hours or activity volume alone.
- Prefer a small set of complete daily workflows over adding disconnected modules.

## Next development priorities

1. Define a small pilot KPI set: on-time completion, overdue work, 5S audit score,
   and reporting effort. Specify period, numerator/denominator, source records and
   missing-data behavior before implementing a configurable KPI model. Hours alone
   must not become a productivity score.
2. Complete the corrective-action loop: source finding, root cause, accountable
   owner, evidence, manager verification and reassessment.
3. Make offline retries idempotent on the server, then add read caching and queued
   photographs without risking duplicate daily logs after uncertain responses.
4. Require an explanation when a closed monthly report is reopened, and preserve
   its previous approved version and the correction history.
5. Verify a deployment with the pilot organization's mail and attachment storage,
   rehearse a restore, then measure adoption and before/after results.

Each next slice should have a working API, applicable web/mobile flow, permission
checks and a real-server regression before another module is added.

## Risks and dependencies

- Incorrect ownership or duplicated time undermines trust in every later report; phase 1 blocks KPI work.
- “Live” requires an explicit freshness target and a delivery mechanism (for example server-sent events or polling); a page that fetches once is not live monitoring.
- Archival requires a policy for corrections, retention, account deactivation, and exports before implementation.
- A productivity claim needs a baseline and comparable observation period; feature completion alone does not demonstrate a productivity increase.
- Production deployment and a pilot depend on access to the target environment and people who can evaluate the workflow.
