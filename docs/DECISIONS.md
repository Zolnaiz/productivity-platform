# Architecture decisions

One entry per decision that would otherwise have to be re-derived from the
code. Each records what was decided, why, and what it rules out — so a later
change is a deliberate reversal rather than an accident.

Newest first.

---

## 2026-09-11 — A mapped column without a migration is a test failure

**Decision.** `migrations/schema-coverage.spec.ts` fails when an entity maps a
column no migration mentions, or when a live table has no migration at all.

**Why.** `DB_SYNCHRONIZE` is false by default and forbidden in production, so a
column TypeORM maps but nothing creates simply does not exist — and every read
and write of that table fails with a missing column. It is invisible in
development, where seeded demo data hides it, and total in production.

This has now happened twice: the 5S layout migrations were named outside the
loader's glob and never ran, and `audit_runs.tier` was mapped with no migration
behind it. Both reached a pull request; the second was caught by review, not by
anything in this repository.

**Consequences.**
- The check is deliberately crude — it asks only whether some migration
  mentions the column name for that table. That is enough to catch a column
  nobody wrote a migration for, which is the mistake actually being made, and
  it does not pretend to verify types or constraints.
- It was validated by deleting the `tier` migration and confirming the test
  fails. A guard that has never been seen to fail is not a guard.

**Rules out.** Shipping an entity change without the migration behind it.

---

## 2026-09-11 — The database enforces one open task per finding

**Decision.** A partial unique index on `(organization_id, source_type,
source_id)` where the task is unfinished. `createTask` still looks first, but
treats a unique violation as "somebody else raised it" and returns theirs.

**Why.** The rule was a read followed by a write, which two callers can both
pass before either commits — two scheduler replicas firing at six, or a
double-clicked button. The index that existed was not unique, so the invariant
the service claimed, and the docs asserted, was never actually held.

**Consequences.**
- The index is partial: a task occupies its finding's slot only while it is
  unfinished. Once done it leaves the index and a recurring finding can raise
  new work, which is the behaviour the rule is meant to have.
- The migration closes pre-existing duplicates before creating the index,
  keeping the newest of each group.
- Only `23505` is treated this way. Any other failure is rethrown, because
  reporting success for work that was never created is worse than an error.

**Rules out.** Claiming an invariant the database does not enforce.

---

## 2026-09-11 — Authenticated files are fetched, not linked

**Decision.** `PhotoEvidence` fetches attachment bytes through the API client
and renders an object URL, releasing it when the attachment goes away or the
component unmounts.

**Why.** The file endpoint is guarded by a Bearer token, and `<img src>` is a
plain browser request that carries no Authorization header. Pointing one at the
endpoint renders a broken image for every signed-in user. It passed local
checking because that was done in the demo workspace, where attachments are
data URLs — the inverse of the demo-divergence problem already recorded here.

**Consequences.**
- Object URLs are tracked in a ref as well as state. The unmount cleanup runs
  once, so reading state through its closure would capture the empty first
  render and free nothing — a leak that holds whole files in memory. A test
  asserts the release actually happens.
- A photo that cannot be fetched says so instead of showing a broken image.

**Rules out.** Putting a guarded endpoint in the `src` of an element the
browser fetches on its own.

---

## 2026-09-10 — Layered audits run on their own clocks

**Decision.** An organization declares its audit layers once on the layout —
tier number, name, role, frequency. Every zone tracks what each layer last
found in `tierAudits`, keyed by tier. The daily job raises one task per zone per
layer that is due, under a key distinct per tier.

**Why.** Layered process auditing is what stops a standard quietly lapsing: the
operator looks every day, the supervisor every week, the manager every month,
and each is partly checking that the layer below is happening. It is also what
gives the four roles real work rather than only permissions.

**Consequences.**
- A single `lastAuditAt` per zone hid the thing worth seeing. A zone can be up
  to date for the operator and long overdue for the manager, and the panel
  reports each layer separately.
- "Never checked at this layer" and "overdue" are shown as different things.
  They are different situations and the difference is what a manager looks for.
- Tiers are an organization's structure, not an area's, so they live on the
  layout and apply to every zone. An organization that has configured none gets
  sensible defaults rather than nothing.
- Anything unrecognised in the stored tier list is dropped, and an entirely
  broken list falls back to the defaults — a bad config should not stop audits.
- `tier.role` cannot yet resolve to a person: there is no users API. The zone
  owner carries the task and the layer is named in it.

**Rules out.** Reporting one audit date for an area that several people are
supposed to check at different rhythms.

---

## 2026-09-10 — The holding area is a state, not a new record

**Decision.** A red tag with status `review` is in the holding area. Entering
that state starts a 30-day clock (`heldAt`, `holdUntil`); `disposed` and
`returned` are the two ways out. A panel lists what is waiting, most urgent
first, and the daily job raises a decision task once a hold runs out.

**Why.** Red-tagging is only evidence because of the wait: an item sits out of
the way for a month, and if nobody misses it, that is the answer. The product
had the tags but not the wait, so "we can probably throw this out" stayed an
opinion.

The existing vocabulary already described this — `open` is still in place,
`review` is waiting, `disposed` and `returned` are the outcomes. Adding a
"holding" status would have repeated the mistake of inventing a fifth value to
make a mechanism fit.

**Consequences.**
- Re-saving a held item does not restart its clock; only entering `review`
  sets the dates, and only when they are absent.
- An item held before these dates existed has no `holdUntil` and is treated as
  due now, so it is chased rather than left waiting for ever.
- "Overdue by 0 days" is not a sentence anyone means: an item whose hold has
  just run out reads as due now.
- The scheduler chases expired holds under a `hold-` source key, distinct from
  the `due-` key an audit uses, so the two never dedupe against each other.

**Rules out.** A holding area that is a list somebody has to remember to open.

---

## 2026-09-08 — A team is formed by invitation, and the token is a credential

**Decision.** An owner, admin or manager invites someone by email and role. The
API returns a raw token once; only its SHA-256 is stored. Accepting the token
creates a user inside the inviting organization, at the invited address.

**Why.** Every registration created a brand-new organization, and no endpoint
could add a second person to an existing one. A platform for organizing a
team's work, on which a team could not be formed.

**Consequences.**
- The token grants membership, so it is handled like a credential: 32 random
  bytes, stored hashed, compared in constant time, expiring after 14 days, and
  usable once.
- The address is fixed by the invitation. A forwarded link cannot be used to
  join under a different identity.
- An invitation cannot hand out a role its sender could not assign — otherwise
  it would be a way around the role hierarchy.
- Re-inviting the same person replaces the pending invitation, so one seat
  never has two valid tokens.
- The public preview endpoint returns only the address and role. A valid token
  must not become a way to read an organization's data.
- Delivery is not built. The inviter shares the link themselves; an email
  transport can layer on later without changing any of the above.

**Rules out.** Joining an organization by any route that does not prove an
invitation was issued for that address.

---

## 2026-09-08 — The audit cycle runs itself

**Decision.** A daily job raises the 5S audits whose frequency has come round,
using the `auditFrequency` every zone already declares. It creates work through
`OperationsService.createTask` with the same dedupe key the web app's manual
button uses, so the two cannot both raise the same audit.

**Why.** `ScheduleModule.forRoot()` was registered in `app.module.ts` and
nothing used it, and every zone declared daily, weekly or monthly while nothing
on the server read it. The map could show a zone as overdue, but only once
somebody opened the page and pressed a button — and a 5S programme that depends
on being remembered is the one that lapses.

**Consequences.**
- Running twice in a day, or on two instances at once, raises nothing extra:
  the scheduler deliberately does not check for an existing task itself, so
  there is one dedupe rule in one place.
- Each layout belongs to one organization, so iterating layouts scopes the work
  without that having to be remembered per query.
- A zone with no readable last-audit date is treated as due. If we cannot tell
  when it was last checked, it should be checked.
- `ENABLE_AUDIT_SCHEDULER` turns it off; it defaults on, because a zone
  declaring a weekly audit should get one.
- The due-date rules are duplicated in the browser. They run in different
  places and nothing packages code between the two workspaces; the server copy
  decides what happens, the browser copy only decides what is drawn.

**Rules out.** A recurring obligation the product describes but never performs.

---

## 2026-09-08 — One test builds the module graph

**Decision.** `operations.module.spec.ts` compiles the module's controllers and
providers through Nest's testing module, with the repositories stubbed.

**Why.** Every other backend spec constructs services by hand with `new`, so
nothing ever exercised dependency injection. A provider that is declared but
not registered, or whose dependency the module does not supply, compiles,
passes the whole suite, and fails only when the application starts. Adding the
scheduler was exactly that risk — and the first run of this test caught a real
gap, that the guarded controllers need `JwtService` in the graph.

**Consequences.** It is the cheapest check that the app can boot. Adding a
provider means adding it here too, which is the point.

**Rules out.** Discovering a broken dependency graph at startup.

---

## 2026-09-08 — A demo mirror for every server rule a screen depends on

**Decision.** Rules the API enforces that a page's behaviour depends on are
mirrored in `services/operations.service.ts`, grouped together and each one
naming the server method it stands in for.

**Why.** Three server-side rules in a row shipped without one, and each time the
demo workspace quietly did less than the product: pressing "Red-tag tasks" twice
doubled the work, finishing a task left its red tag open, and submitting an
audit did not move the score onto the map. None of it failed loudly.

The demo workspace never reaches the API, and it is what most people see first —
including anyone reviewing this project. A demo that behaves differently from
the product is worse than no demo, because it is believed.

**Consequences.**
- Adding a rule to `OperationsService` means asking whether a screen depends on
  it, and mirroring it if so.
- Demo records are stamped with `createdAt`, because the server stamps it and
  anything showing when a record was made otherwise renders a dash.

**Rules out.** A server-side rule whose absence in demo mode is only discovered
by using the demo.

---

## 2026-09-08 — Audit-cycle dates are their own tested module

**Decision.** `components/fives/auditSchedule.ts` holds the calendar arithmetic
for the audit cycle, and tolerates both a date and a full timestamp.

**Why.** `lastAuditAt` was a plain date in seeded plans and became a timestamp
once the server started writing it. `addDaysToDate` concatenated `T00:00:00`
onto whatever it was given, so a timestamp produced an invalid date and the
`toISOString()` that followed threw — crashing the entire floor plan the first
time a real audit scored a zone. The helpers were private to a 3,000-line
component and nothing exercised them.

**Consequences.**
- A zone whose last-audit date cannot be read is treated as due, which is the
  safe default: if we cannot tell when it was last checked, check it.
- The module is pure and has its own tests, including the month, year and
  timezone boundaries that date arithmetic gets wrong.

**Rules out.** Date arithmetic buried in a component where no test can reach it.

---

## 2026-09-08 — Finishing the work closes the finding, but does not decide it

**Decision.** When a task raised from a red tag is completed, the server sets
`closedAt` on that tag. It does not change the tag's status, and a tag with
`closedAt` no longer counts as open on the map.

**Why.** This is the last joint of the 5S loop. The link ran one way — work knew
its finding, but clearing the item left the tag open for ever, so the map kept
reporting a problem somebody had already fixed.

Setting a status was the first attempt and was wrong. A red tag's vocabulary is
`open | review | disposed | returned`; "closed" is not one of them, and the two
terminal values are real decisions — was the item scrapped, or put back where it
belongs — made in the holding-area review. Finishing the cleanup task says the
work happened, not which way it went. Inventing a fifth status also left the
status select with nothing selected.

**Consequences.**
- `isOpenRedTag` checks `closedAt` as well as status, so the open count falls
  when the work is done rather than when someone remembers to file a
  disposition.
- Only red tags close this way. A task raised from an audit is verified by the
  next audit, not by someone ticking it off.
- A task whose tag has been deleted from the plan still completes.

**Rules out.** Adding a value to a domain vocabulary to make a mechanism fit.

---

## 2026-09-08 — Demo records get a collision-free id

**Decision.** Every record created in the demo workspace takes its id from
`localId()` in `services/api.ts`, which prefers `crypto.randomUUID`.

**Why.** Eight services each generated `local-${Date.now()}`. The "Red-tag
tasks" button raises one task per open tag in a single pass, so all eight
landed in the same millisecond with the same id: of eleven demo tasks, only
five ids were distinct. `updateDemo` matches by id, so finishing one task
rewrote every task created alongside it — which is how a red tag other than the
one being cleared ended up closing.

**Consequences.**
- The demo workspace is the first thing most people see, including anyone
  reviewing this project. A bug that only appears when several records are
  created at once is exactly the kind a demo surfaces and a test suite misses.
- `api.test.ts` asserts 500 ids in a tight loop are distinct, with and without
  `crypto.randomUUID`.

**Rules out.** A timestamp as an identifier.

---

## 2026-09-02 — Attachments are typed by their bytes and scoped by tenant

**Decision.** Photographs and PDFs attach to any 5S record through one
`attachments` table and one `PhotoEvidence` component. The server reads the
file's real type from its first bytes, generates the storage key itself, and
filters every read by organization.

**Why.** There was no file support anywhere in the product, and 5S runs on
evidence: a red tag is a claim until there is a picture of the item, and a fix
is unproven until the after shot sits beside the before one. An audit score
without photographs is an opinion.

**Consequences.**
- The declared `Content-Type` is a hint from the client and is trusted for
  nothing. A PHP script or a Windows binary renamed `photo.jpg` is refused, and
  nothing is written to disk when it is.
- The storage key is a random id plus an extension taken from the sniffed type,
  so no client-supplied text ever reaches the filesystem. The original filename
  is kept as a label only, stripped of path separators and control characters.
- Files are served with `Content-Disposition: attachment` and a sandboxing CSP,
  so an upload cannot execute against a signed-in session on this origin.
- Every read, list and delete is filtered by `organizationId`. One tenant
  cannot reach another's photographs even holding a correct attachment id.
- The demo workspace stores downscaled data URLs. It is not a file store and
  does not pretend to be one, but the before/after pair works.
- `owner_id` is a plain column: red tag and zone ids live in the floor plan's
  JSON, so a foreign key is not available.

**Rules out.** Trusting a client's filename or content type for anything.

---

## 2026-09-02 — A finding raises one task, and the task remembers the finding

**Decision.** `WorkTask` carries `sourceType` and `sourceId`. Work raised from a
red tag, an audit run or an improvement record records where it came from, and
the server returns the existing open task rather than creating a second one for
the same source.

**Why.** A red tag already carries an owner, a due date and a status — it is a
task wearing a different name — but it appeared in nobody's list. The floor plan
had a "Red-tag tasks" button that created tasks with no link back, so pressing
it twice doubled the work and no task said why it existed.

**Consequences.**
- Only unfinished tasks count as duplicates. A red tag that returns after its
  task was completed raises new work, which is also the signal that a standard
  is not holding.
- The rule lives on the server so the mobile app inherits it, and is mirrored in
  the demo workspace — otherwise the demo would show behaviour the product does
  not have, and the demo is what most people see first.
- `sourceId` is a plain string, not a foreign key: red tag and zone ids live in
  the floor plan's JSON. A source can disappear and the task survives it.
- A task typed by hand has no source and is never deduplicated.

**Rules out.** Creating work from a finding without recording the link.

---

## 2026-09-02 — An audit scores a zone, and the map reads the score

**Decision.** `AuditRun` carries a `zoneId` referencing a zone on the
organization's 5S floor plan. Submitting a non-draft run writes that score and
date onto the zone, server-side, and freezes the first score as a baseline. The
floor plan can then paint zones by condition instead of by a chosen colour.

**Why.** The four objects of a lean cycle — zone, finding, action, verification
— all existed, but nothing joined them. `AuditRun.location` was free text, so a
score could never be matched back to a place. The client worked around this by
parsing the string (`location.split('-')[0]`) and comparing it to a zone code,
which silently did nothing whenever someone typed the location differently, and
was a read-modify-write of the whole plan that could overwrite a concurrent
edit. Fixing it in the browser would also have left the mobile app out.

**Consequences.**
- The audit form picks a zone rather than typing a place, so the match cannot
  fail. `location` remains for audits of places not on the map, and so a run
  still reads sensibly after a zone is renamed or deleted.
- Draft runs do not touch the map: a half-finished checklist should not repaint
  it. A run whose zone has been deleted still records — the audit is history
  even when the place is gone.
- The condition palette is a status scale, not a sequential ramp, because
  practitioners read scores in bands. Validated against the map surface (white
  in both themes) and never the only signal: every zone prints its score.
- Zone ids live in the layout's JSON rather than a table, so `zoneId` is a
  string, not a UUID foreign key. A deleted zone is therefore possible and is
  handled rather than prevented.

**Rules out.** Matching a record to a place by parsing its display text.

---

## 2026-09-02 — Migrations must be named for the glob that loads them

**Decision.** Every operations-platform migration filename contains
`Operations` or `Runtime`, which is what `data-source.ts` globs for.

**Why.** The two 5S layout migrations were named `CreateFiveSLayoutsTable` and
`AddFiveSLayoutBackgroundFields`, matching neither pattern, so they never ran.
`five_s_layouts` was missing from every real database — the flagship feature
had no table, and the runtime smoke did not catch it because it only exercises
projects.

**Consequences.**
- Renaming a migration file is safe: TypeORM records the class name, which did
  not change.
- The legacy `1700000000xxx` migrations remain deliberately excluded; they
  belong to the questionnaire schema this project grew out of.

**Rules out.** Adding a migration whose filename matches neither pattern.

---

## 2026-09-02 — The API names failures with a code; the client supplies the words

**Decision.** Every error response carries an `errorCode` — a stable identifier
such as `AUTH_INVALID_CREDENTIALS` — alongside its English `message`. The codes
are declared once in `backend/src/shared/errors/api-error.ts`, which also owns
each code's HTTP status and English fallback. The browser looks the code up in
`admin-web/src/i18n/locales/*.ts` under `errors.<CODE>` and shows the result.

**Why.** The frontend reads every string from the locale files, but the backend
sent prose, so a Mongolian workspace showed English sentences the moment
anything failed. Translating on the server was the obvious alternative and is
worse: the server would need its own copy of the locale files, kept in step with
the client's, in order to guess a language it only knows from a header.

Sending a code instead also removes a class of bad message. Sign-in previously
reported *"Check that the backend API is running"* for every failure, including
a wrong password, because the page had no way to tell the causes apart.

**Consequences.**
- Code strings are API contract. Renaming one silently degrades every client
  that matched it to the generic message. `errorContract.test.ts` reads the
  backend's declaration and fails if a code has no wording — or if wording
  survives a code that no longer exists.
- Errors thrown by code we do not own — a class-validator rejection, a bare Nest
  exception — are classified by status in the exception filter, so a response
  never reaches a client without a code.
- `details` on `apiError` appends to the English fallback only. It takes data — a
  record name, an id — never a sentence, because nothing in it is translated.
- `offline` and `unknown` are the client's own codes; no server sends them.
- A 401 from `/auth/*` is now excluded from the token-refresh interceptor. It
  had been treated as an expired session, and the redirect that followed
  reloaded the page and discarded the message explaining the failure.

**Rules out.** Returning a user-facing sentence from the API and displaying it
verbatim.

---

## 2026-09-02 — The app ships in Mongolian and English through i18next

**Decision.** All user-facing copy lives in `src/i18n/locales/{en,mn}.ts` and is
read through `react-i18next`. English is the reference locale; Mongolian is
typed against it with a mapped type that keeps the keys and frees the values.

**Why.** Settings offered a Mongolian/English picker and showed a toast saying
the language had changed, but there was no translation layer, so nothing did —
the control lied. Separately, 16 of 28 pages mixed an English heading with a
Mongolian body, because there was nowhere for the two languages to live apart.
The first real deployment is Mongolian (MPC) while the product is aimed at a
wider market, so neither language could simply be dropped.

**Consequences.**
- Adding an English key fails the build until the Mongolian value exists, and a
  test fails if a Mongolian value is left identical to the English one.
  Deliberately shared terms are listed explicitly in `i18n.test.ts`.
- The workspace stores `mn-MN` while i18next works in `mn`; `normalizeLanguage`
  accepts either. A browser that has never chosen a language follows the
  workspace setting.
- Tests run against English so assertions stay stable if the product's default
  language changes. `src/test/setup.ts` initialises i18n for every test file —
  without it a component under test renders raw keys.

**Rules out.** Hardcoded user-facing strings in components. If a string is worth
showing, it is worth a key.

---

## 2026-09-02 — Chart colour is validated, not chosen by eye

**Decision.** Chart palettes live in `src/components/charts/palette.ts` and were
checked with the data-viz validator against the surfaces charts actually render
on — white in light mode, `#1f2937` in dark — rather than a generic surface.
`palette.test.ts` re-asserts the properties that matter: monotone lightness,
adjacent step separation, and contrast against each surface.

**Why.** The three Recharts wrappers that existed before had zero importers and
all hardcoded a white tooltip with dark text, so the first person to use one
would have shipped an unreadable dark mode. Colour correctness is computable;
leaving it to taste is how that happens.

**Consequences.**
- One measure gets one hue. A light-to-dark ordinal ramp is only for categories
  with a real order (pipeline stages), never for nominal ones — that would
  encode bar length twice.
- Values are directly labelled, so no number is reachable only by hovering, and
  labels wear ink tokens rather than the series colour.
- Changing a card background invalidates the palette; re-run the validator.

**Rules out.** Adding a chart colour without running the validator against both
surfaces.

---

## 2026-09-02 — Pages build on `components/common`, not raw elements

**Decision.** Forms use the shared `Input`, `Select`, `Textarea` and `Button`;
lists use `Table`; loading state is `Card`'s `loading` prop, which renders
`Loading`. Destructive actions go through `ConfirmDialog`, and create forms open
in a `Modal` from a header button.

**Why.** The component library already existed but the pages bypassed it:
`Input`, `Modal`, `Table` and `Loading` had no importers at all, `Button` had
one, and the same field class string was pasted 34 times. A styling change meant
editing every page.

**Consequences.**
- Adoption was made visually neutral first: the shared components were changed
  to match what the pages already rendered, so no screen shifted.
- Fixing a component now fixes the app. Three defects were found precisely
  because the components were finally being used: `Input` generated its id with
  `Math.random()` on every render, breaking the label link after the first
  re-render; `Table` rendered `value || '-'`, so a real zero displayed as "no
  data"; `Loading` asked for a `border-3` that Tailwind does not ship.
- What stays hand-written is deliberate: range inputs and checkboxes, which
  share no styling with text fields, and link-styled row actions, which the
  Button variants do not cover.

**Rules out.** A new page writing its own field or button markup.

---

## 2026-09-01 — The 5S floor plan is a direct-manipulation editor

**Decision.** Zones and objects are edited on the canvas: drag to move with
snap-to-grid (Alt overrides), corner handles to resize, arrow keys to nudge,
Delete to remove, Escape to deselect, Ctrl+Z to undo. Fifty steps of history are
kept in the component.

**Why.** Laying out a room by typing coordinates into a properties panel does not
work, and every edit wrote straight through to storage with nothing to undo it.

**Consequences.**
- A pointer drag fires an update per frame, so history is recorded once on
  pointer-down and the moves themselves skip it; one undo reverses the whole
  gesture rather than one frame of it.
- Saves are debounced to the settled plan and flushed on unmount and pagehide.
  Against a real backend the previous behaviour was a PATCH per pointer frame,
  whose responses could also land out of order. Reset and import cancel a
  pending write so a late save cannot undo them.
- Keyboard shortcuts are registered once and read the current handler through a
  ref updated in a layout effect. Re-registering per render left a window where a
  keypress was handled by a stale closure — it made the keyboard tests fail about
  one run in six.

**Rules out.** Adding a canvas action that bypasses the history stack.

---

## 2026-09-14 — One role table, and permissions the server actually enforces

**Decision.** `backend/src/shared/roles.ts` holds two tables and nothing else
holds either of them: which roles a role may hand out, and what each role may
do. Routes name a permission with `@RequirePermission`; `PermissionsGuard`
refuses the request when the caller's role does not carry it. The client asks
`GET /users/profile/permissions` to decide what to draw, and gets the same
table.

**Why.** Three separate copies of "who may do what" existed and all three
disagreed with each other and with the code.

- The role hierarchy was written twice. `invitations.service.ts` covered all
  six roles; `users.service.ts` covered four. So an organization admin could
  *invite* a manager but could not *promote* a colleague to manager, and
  `manager` and `viewer` could be invited into roles that then granted them
  nothing.
- The permission list in `users.service.ts` named questionnaires, responses and
  expenses — two of which are modules this system does not have — and was read
  by nobody. Every operations route was guarded by `OperationsAuthGuard` alone,
  which checks only that the caller is signed in and has an organization. A
  `viewer` could delete a project; a `user` could rewrite the audit templates
  the whole plant is scored against. The client hid those controls, which is
  not the same as the server refusing the request.
- `UsersController` named roles directly, `@Roles(SUPER_ADMIN,
  ORGANIZATION_ADMIN)`. The seeded workspace owner is an `admin`, so the owner
  could not list their own team.

**Consequences.**
- `UpdateUserDto` no longer carries `role`, `organizationId`, `isActive` or
  `password`. It carried all four while `PATCH /users/:id` did
  `Object.assign(user, dto)` and `checkUserAccess` let anybody reach their own
  record — so any signed-in account could promote itself to super admin, or
  move itself into another tenant, in one request. Each of those four now has
  its own route with its own check. The global pipe runs
  `forbidNonWhitelisted`, so sending one is a 400 rather than a silent drop,
  and `UsersService` filters to an explicit field list as well, because it is
  also called from inside the application where no pipe runs.
- Nobody can assign their own role. There is therefore no path through the API
  to a second super admin; that seat comes from seeding. `changeRole` also
  refuses to act on the caller themselves, and refuses to change a member whose
  current role the caller could not have granted — without that last check an
  administrator could not promote past themselves but could demote the person
  above them, which comes to the same thing.
- `route-permissions.spec.ts` walks both operations controllers and fails when
  a route names no permission or names one the table does not define. Adding a
  route without deciding who may call it is now a failing test rather than an
  open endpoint.
- `ALLOW_PUBLIC_OPERATIONS` is interpreted in one place: `OperationsAuthGuard`
  marks the request it let through anonymously, and `PermissionsGuard` reads
  the mark rather than the flag.
- `OrganizationsModule` is still not registered in `AppModule`, so its routes
  do not exist. That is left as it was — wiring an unreviewed CRUD surface into
  the app graph is a separate decision, not a side effect of this one.

**Rules out.** A second list of roles or permissions anywhere. A route that
changes data without naming the permission it needs. Putting a privilege field
back into an edit DTO.

---

## Template for new entries

```
## YYYY-MM-DD — One-line decision

**Decision.** What was decided, concretely enough to check code against.

**Why.** The problem it solves. Include the evidence — a measurement, a defect,
a constraint — not just a preference.

**Consequences.** What follows from it, including anything surprising.

**Rules out.** What this decision makes a mistake.
```
