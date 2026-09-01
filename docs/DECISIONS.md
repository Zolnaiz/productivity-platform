# Architecture decisions

One entry per decision that would otherwise have to be re-derived from the
code. Each records what was decided, why, and what it rules out — so a later
change is a deliberate reversal rather than an accident.

Newest first.

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
