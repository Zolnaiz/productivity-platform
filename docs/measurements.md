# Monthly measurements (K1–K6)

The monthly report counts six indicators from the thesis (`docs/diploma/latex/Chapters/Chapter1.tex`, table `kpi`, and the pseudocode in `Chapter3.tex`, listing `lst:kpi`). They are computed by pure functions in `backend/src/operations/monthly-measurements.ts` and tested in `monthly-measurements.spec.ts` and `monthly-report.spec.ts`.

Every result has the same shape:

```ts
{ value: number | null, numerator: number, denominator: number, excluded: number }
```

- `value` is `null` when nothing could be counted. A report never shows "no data" as a measured 0.
- `excluded` counts the records that were candidates but could not be used (missing or invalid dates, and so on). It is shown next to every number.
- Dates are placed on the organisation's calendar (`timeZone` in the result) before they are compared.
- The **reference day** is the month's last day once the month has ended, and today while the month is still running. K2 and K6 are "as of" this day.
- An employee sees measures counted from their own records. A manager or administrator sees the team's records.

The records behind K2, K4 and K6 come back in `measurements.evidence`. The report page lists them under each number, and the CSV export lists them below the table, so you can trace each number to the tasks or check-ins it was counted from.

| Code | Key | Value | Numerator | Denominator | Excluded | Null when |
|---|---|---|---|---|---|---|
| K1 | `onTimeDelivery` | % (1 decimal) | tasks finished this month on or before their due day | tasks finished this month that have a valid completion date and a valid due date | finished tasks with a missing or invalid date | no dated completions |
| K2 | `lateWork` | mean days late | total days late (reference day − due day) | open tasks that are overdue at the reference day | candidates with an invalid due date; done tasks with no completion date | no task is late (denominator 0 means "none late"), or the report predates K2 |
| K3 | `zoneAuditScore` | mean score /100 | sum of valid scores | submitted or completed audits that are linked to a zone | zone audits that are drafts or have a score outside 0–100 | no scored zone audits |
| K4 | `fixClosureDays` | mean days (1 decimal) | Σ (completedAt − createdAt) in days | tasks with `sourceType = audit_run` completed this month | missing moments, or completion before creation | no audit fixes completed this month |
| K6 | `checkinRate` | % (1 decimal) | person-weeks with a weekly check-in | expected people × weeks in the month that started on or before the reference day | check-ins by people who are not expected, or for weeks outside the month | nobody is expected, no week has started yet, or the report predates K6 |
| — | `workLinkage` | % | work logs linked to a project or a task | all work logs this month | — | no work logs |

K5 (time spent preparing the monthly report) and K7 (SUS) are not computed from system records. The thesis measures them by observation and a questionnaire.

## Decisions where the thesis left room (please confirm)

1. **K2 is a snapshot at the reference day.** The thesis says "today − dueDate". A month that has ended uses its last day, so the number does not keep changing after the month is over. A task counts as late on that day when it is not backlog, has a due day before the reference day, and was not finished by then. A task that was finished after the reference day still counts as late on that day. The task count is the `denominator`, and the mean lateness is the `value`.
2. **K2 includes earlier months.** A task that was due in February and is still open in March is late in March. This is why the monthly records now carry `lateCandidates`: committed tasks with a due date that were not finished before the month began.
3. **K4 uses exact elapsed time** between the moments `createdAt` and `completedAt`, in fractional days rounded to one decimal, not whole calendar days. It only counts tasks raised by an audit (`audit_run`). Red-tag tasks are a separate source and are not included.
4. **K6 is measured in person-weeks.** The thesis measures K6 weekly. For a month, the rate is the share of (person, week) pairs that have a check-in, which is the same as the average of the weekly shares. A week belongs to the month that contains its Monday. "Expected people" are active members with the role `user` or `manager`. Administrators are not expected to write check-ins.
5. **Reports closed before this change** have no `lateCandidates`, `weeklyCheckins` or `members`, so K2 and K6 are `null` for them ("no data"). They are not recomputed from live data.

## Fix verification (PDCA "Check")

`GET /operations/improvement-verification` (`backend/src/operations/improvement-verification.ts`) answers whether the work an audit raised actually brought the area back. For each task with `sourceType = audit_run`:

| Status | Rule |
|---|---|
| `open` | the fix task is not done |
| `done_undated` | done, but closed before completion moments were recorded; no re-audit can be matched, so it is excluded from the rate |
| `awaiting_reaudit` | done, and no submitted audit of the same zone after its `completedAt` |
| `verified` | the first audit of the zone after the fix scored ≥ 85 |
| `improved` | that audit scored higher than the failing one, but below 85 |
| `not_improved` | that audit scored the same or lower |

`verificationRate` = verified / re-audited (verified + improved + not improved), the same `{value|null, numerator, denominator, excluded}` shape. `excluded` counts fixes whose triggering audit no longer exists, and `done_undated` fixes. An employee sees the fixes assigned to them, a manager the team's. Shown on the web under 5S → Results.

Beside whether it worked, each fix carries the rest of the corrective-action loop:

- `rootCause`: why the area fell short, written by whoever works the fix (or a manager).
- `signedOffBy` / `signedOffAt`: a manager's check that the finished work was done properly (`POST /tasks/:id/sign-off`, permission `fixes:signoff`). It is refused for an unfinished fix and for whoever did the fix, and it is cleared when the fix is reopened.

`counts.rootCauseRecorded` and `counts.signedOff` say how much of the loop is filled in. Neither changes the verification rate: only the next audit decides whether a fix worked.
