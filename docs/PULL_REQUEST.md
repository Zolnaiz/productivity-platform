# Pull request: `feat/design-system-adoption` → `main`

Ready to open. Everything below was verified on 2026-09-25 against the branch
head; `gh` is not authenticated in the environment these commits were written
in, so the pull request itself has to be opened by somebody who is.

```bash
gh pr create --base main --head feat/design-system-adoption --title "Make the floor plan a floor plan, and the numbers true" --body-file docs/PULL_REQUEST.md
```

Or open it in the browser:
<https://github.com/Zolnaiz/productivity-platform/compare/main...feat/design-system-adoption>

## What this branch does

Nine threads run through it.

**The floor plan became a floor-plan tool.** It was rectangles floating in an
abstract canvas. It now has walls that meet at shared corners and close into
rooms with real areas; doors and windows cut into those walls, with the wall
rendered as the pieces left standing and a door carrying the quarter circle its
leaf sweeps; an object catalogue in metres — a desk 1.6 × 0.8 m, a EUR-1 pallet
1.2 × 0.8, a racking bay 2.7 × 1.1 — that snaps flush and square to walls;
corners you can drag, and drop on each other to close a room that never quite
closed; named rooms; and separate Grid, Snap and Dimensions switches where one
checkbox used to answer all three questions. A building has as many plans as it
has floors, and every printed zone label can carry a QR code that opens that
area on a phone.

**Numbers that nothing produced were removed.** A new workspace was handed a
pre-drawn sample office as though it were its own building. A project's progress
was a slider somebody dragged, and the dashboard and the monthly report averaged
that figure as if it had been measured. Both are gone: an empty plan stays empty
and the editor asks how to begin, and a project counts its tasks. The monthly
report is compiled person by person from what each of them actually recorded,
and each room reports what its 5S areas add up to.

**Work is delivered rather than discovered.** The scheduler raised audits at six
in the morning and red-tag decisions when a hold ran out, and told nobody. A
notification is now a record addressed to one person, carrying the task's own
words, delivered exactly once however many times the event is re-raised. And
the audit trail records what a request asked to change — with secrets keeping
their name and losing their value — rather than only that something changed,
and stops keeping rows for ever.

**The phone became a tool rather than a notice board.** A zone label opens the
area it names, and from that page the person standing there can raise a red
tag, record that the area was cleaned, and walk the 5S checklist itself —
question by question, answers big enough to tap without looking, the score
shown before it is recorded rather than after. Each of those is a narrow route
with its own permission (`redtags:create`, `zones:clean`, `audits:create`)
rather than `zones:update`, so an operator can say what they found without
being able to move a wall. A walk defaults to the most senior audit layer the
person covers, because recording a supervisor's check as the operator's resets
the wrong clock. And a failing score now raises its corrective task on the
server: it used to be raised by the browser, which meant it happened only for
an audit typed up at a desk by somebody senior enough to create tasks, so the
daily checks that actually find things led to nothing.

**The evidence survives a deployment.** Attachment bytes were written inside
the container and the production compose file mounted nothing at them: every
row survived a redeploy and every photograph it pointed at did not. Where they
live is now a choice behind one interface — a local volume, or an S3-compatible
object store that `S3_ENDPOINT` can point at MinIO on a customer's own
hardware — and the backup runbook covers both, with `npm run attachments:check`
reporting any row whose photograph is not in the store.

**The organization has a shape, and the reports use it.** Departments were a
page with a browser-local list and a notice admitting it; the question behind
it was never how to store a name but what a department owns. It owns its
people and its 5S areas, so an area's responsibility outlives the person whose
name is on it. The monthly report gained a row per department — its people's
work, the average score of the areas it answers for, its open red tags, its
overdue audits — and a row per building, because a plant with two of them was
reading as one.

**A layered audit reaches somebody who can do it.** Every layer's task went to
the area's owner, so the supervisor's weekly check and the manager's monthly
one arrived in the operator's list — the one place they cannot be done from,
and the opposite of what layered auditing is for. The owner now keeps any
layer within their own level and anything above it goes to the department's
manager. The layers themselves are the organization's to name, time and staff,
and each can carry its own checklist; they were read from the plan, defaulted
sensibly, and stored nowhere at all.

**What the product knows is the customer's, not the source's.** A 5S
programme's registers — the improvement record, the red-tag cards, the
assessment scores, the checklist progress — lived in the browser that typed
them, so a programme's memory was somebody's laptop. The standard those
registers are kept against was a hundred Mongolian strings inside a React
component, which meant every organization read one customer's standard and
that customer could not change a word of it without a release. Both are now
the organization's own data. So is the mail that leaves the building: work
raised for somebody reaches their inbox and, where a deployment configures a
transport, their email — and invitations go out the same way rather than being
pasted into a chat window by the inviter.

**The interface speaks both languages and both themes.** About 120 English
strings were hardcoded into the 5S page, including the sentences the rules
module assembled to say what an area still needs — so a Mongolian workspace read
most of its biggest page in English. And the plan was drawn on pure white
whatever the theme, so at night it was the brightest thing on screen.

## Defects found and fixed along the way

Each was found by opening the application, not by a test:

- **The wall graph was never stored.** `corners`, `walls`, `openings` and the
  scale were not in the save payload and had no columns. A plan drawn against a
  real backend was complete on screen and empty after a reload.
- **Pointer coordinates ignored the SVG's letterboxing.** In a tall, narrow
  pane a click landed a third of the plan away from where it was aimed, and
  every drag in the editor went through that function.
- **Two lookups took the organization's first floor plan.** Once a building had
  a plan per floor, an audit of a zone upstairs would have repainted nothing
  and a red tag raised upstairs would never have closed — both silently.
- **Six of fourteen object types were refused by the validation pipe**, so a
  chair or a printer was placeable and unsaveable.
- **The demo user's id did not match the member list's id for the same person**,
  so everything the demo user did was recorded against somebody not on the
  staff list.
- **Both `npm audit` steps in CI were failing** before any of this work —
  eighteen advisories on the backend, twelve on the frontend.
- **Attachment bytes were written inside the container** and the production
  compose file mounted nothing at them: every row survived a redeploy and
  every photograph it pointed at did not.
- **The demo held one floor plan**, which hid a real defect: both browser
  services reached for that single plan, so an audit recorded against an area
  upstairs would have repainted the ground floor — the same fault the server
  had and had fixed.
- **A test raced.** It read the page synchronously after a click that
  navigates once a promise resolves, passing on an idle machine and failing on
  a loaded run of the whole suite.
- **The browser suite had silently stopped running.** It searched for English
  labels while the interface defaults to Mongolian, so it matched nothing. Two
  of the checks that replaced it were also passing vacuously — one counted a
  wall thickness the fixtures never use, one clicked the sidebar.
- **Production mounted no volume for attachments at all**, and
  `backend/.env.example` documented `UPLOAD_PATH`, a variable nothing has ever
  read.
- **A failed "cleaned today" said nothing.** The failure message was rendered
  inside the red-tag form, so the one case it exists for — somebody believing
  they have recorded something they have not — showed an unchanged page.

## Verification

Run on the branch head:

- Backend: 648 tests, lint clean, build clean, `npm audit` reports zero.
- Frontend: 829 tests, lint clean, build clean, `npm audit` reports zero.
- Eleven Playwright checks run against the application in CI, in demo mode, in
  a real browser: signing in, drawing a wall, the plan at night, the monthly
  report, a zone label, raising a red tag, recording a cleaning, walking a
  checklist through to the follow-up task it raises, a department's counts,
  moving between two buildings, and drawing a walked route that comes back in
  metres.
- Migrations: all 23 apply to a fresh PGlite database; every mapped column
  exists, the schema is writable, and the partial unique index holds.
- `npm run attachments:check` and the seed were run against a real PostgreSQL:
  the check reports a clean store and then finds, names and exits non-zero on
  a row whose file was never written, and the seed writes the organization's
  5S standard into its own row.
- The floor plan, the projects page, the monthly report, the notification inbox
  and both themes were exercised in a browser against the dev server; the zone
  page was exercised at phone width, including a photograph attached to a
  recorded check and read back in the history panel at desk width.
- `npm run attachments:check` was run against a real PostgreSQL: clean on an
  empty store, and a row pointing at a file that was never written is found,
  named and exits non-zero.

## Risk

**Schema.** The migrations add columns to `five_s_layouts` (`corners`,
`walls`, `openings`, `metres_per_unit`, `room_labels`, `snap_to_grid`,
`show_dimensions`, `floor`, `audit_tiers`, `routes`), `changes` and
`before_values` to `audit_log_entries`, `title_key` and `title_params` to
`work_tasks` and `notifications`, `department_id` to `users`, and create
`notifications`, `departments` and `five_s_guidelines`. All are additive with
defaults; no column is dropped or retyped, and an older client that does not
send the new fields still saves — a save that omits the audit layers or the
routes keeps what is stored rather than clearing it.

**Configuration.** Six new environment variables (`ATTACHMENT_STORE`,
`S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY`) all default to the behaviour that was there before, so
an existing deployment needs no change — except that it should now mount a
volume at `UPLOAD_DIR`, which the production compose file does.

**Permissions.** Four are new. `zones:clean` and `guidelines:update` sit in the
`user` block beside `redtags:create` — recording that an area was cleaned, and
filling in the improvement register, belong to whoever did the thing.
`guidelines:read` and `departments:read` are open to every role that can sign
in, because a standard nobody can read is not one and a page that cannot name
the department answerable for an area is a worse answer than one that can.
Creating and retiring departments is an administrator's job.

**Dependencies.** `react-router-dom` moved from 6 to 7 — every router API this
application uses is unchanged there, and the whole suite and a browser pass —
multer is forced to a patched 2.4.0 through an override rather than by
upgrading NestJS, which is left as its own piece of work. Two are new and each
is loaded only by the transport it belongs to: `@aws-sdk/client-s3` for the
object store and `nodemailer` for SMTP. Both default to off.

**Configuration.** Thirteen new environment variables, all defaulting to the
behaviour that was there before: the attachment store (`ATTACHMENT_STORE` and
the `S3_*` family), the mail transport (`MAIL_TRANSPORT`, `MAIL_FROM`, the
`SMTP_*` family) and `APP_BASE_URL`, which is what makes a link in a message
clickable. An existing deployment needs no change — except that it should
mount a volume at `UPLOAD_DIR`, which the production compose file now does.

**Not verified.** Nobody has scanned a printed QR label with a phone. The S3
store and the SMTP transport have been exercised against fakes and not against
a live object store or a live relay, because neither a container daemon nor a
mail catcher was available here — both belong in the MPC deployment step. And
none of this has run against a production deployment.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
