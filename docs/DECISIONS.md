# Architecture decisions

One entry per decision that would otherwise have to be re-derived from the
code. Each records what was decided, why, and what it rules out — so a later
change is a deliberate reversal rather than an accident.

Newest first.

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

## Template for new entries

```
## YYYY-MM-DD — One-line decision

**Decision.** What was decided, concretely enough to check code against.

**Why.** The problem it solves. Include the evidence — a measurement, a defect,
a constraint — not just a preference.

**Consequences.** What follows from it, including anything surprising.

**Rules out.** What this decision makes a mistake.
```
