# UI guidelines

How a screen in this product is built. These are the rules the existing pages
follow; a new page that follows them will look like it belongs without anyone
having to review it for consistency.

The reasoning behind several of these is in [DECISIONS.md](DECISIONS.md).

## Page skeleton

Every page opens the same way:

```tsx
<div className="space-y-6">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('page.title')}</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('page.subtitle')}</p>
    </div>
    <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
      {t('page.newThing')}
    </Button>
  </div>
  {/* content */}
</div>
```

The subtitle says what the page is for in one sentence. Creating opens a dialog
from the header button — a permanently expanded "New X" card pushes the records
the page exists to show below the fold.

## Four states, always

Every page that loads data handles all four:

| State | How |
|---|---|
| Loading | `<Card loading><div /></Card>` — never a hand-written sentence |
| Empty | `<EmptyState icon={...} title={...} description={...} />`, or `Table`'s `empty` slot |
| Error | The red banner pattern, with a message from the locale file |
| Success | The content |

Empty-state copy says what will appear here and what to do to make it appear.

## Errors from the API

A failed request is turned into a sentence by `apiErrorMessage(error, t)`, which
reads the `errorCode` the API returned and looks its wording up in the locale
files. Never display `error.response.data.message` — that is English prose meant
for logs, and it will appear untranslated in a Mongolian workspace.

```tsx
} catch (submitError) {
  setError(apiErrorMessage(submitError, t));
}
```

A message for a new backend code goes in `errors.<CODE>` in every locale;
`errorContract.test.ts` fails if one is missing. Say what happened and what the
person can do about it — "Contact your workspace admin" earns its place, "an
error occurred" does not.

## Components

Use these; do not re-implement them.

| Need | Component |
|---|---|
| Text, number, date, email input | `Input` |
| Dropdown | `Select` |
| Multi-line text | `Textarea` |
| Any button | `Button` (`primary` / `outline` / `ghost` / `danger`) |
| Panel with a title | `Card` |
| Row list with headers | `Table` |
| Dialog | `Modal` |
| Destructive confirmation | `ConfirmDialog` |
| Nothing to show | `EmptyState` |
| Spinner | `Loading` (usually via `Card`'s `loading`) |

Hand-written markup is right for range inputs and checkboxes, which share no
styling with text fields, and for link-styled actions inside a table row.

**Dense contexts** — board cards, table rows — pass `fieldSize="sm"`.

## Forms

- Every field carries a visible `label`. Placeholder-only labelling disappears
  the moment someone types.
- Fields in a repeating row (audit questions, the question builder, filter
  selects) use `aria-label` instead, so the row does not grow a second column of
  visible text.
- Required fields get `required`; the asterisk is decoration and stays out of the
  accessible name.
- Error and helper text go through the component's `error` / `helperText` props,
  which link them to the field with `aria-describedby`.
- The submit button comes after the inputs, never between them.
- A form in a dialog ends with Cancel and the primary action, right-aligned.

## Destructive actions

Anything that destroys saved work confirms first, through `ConfirmDialog` with
`destructive`. Name the record in the message and say what is lost. Disable the
confirm button while the request is in flight so a double click cannot fire two
deletes.

Two kinds of action confirm *without* `destructive`, because they change who can
reach something rather than destroying it — publishing a template, archiving
one. Say what changes and that it can be changed back.

Two kinds do not confirm at all:

- **Actions with a real undo.** The 5S canvas keeps fifty steps of history, so a
  dialog on every delete would be noise.
- **Edits to something not yet saved.** Removing a question while building a
  template changes a draft in memory; re-adding it is the undo.

The test is whether a misclick loses work the person cannot get back. A row in
the 5S guideline registers is written to storage as it is typed and has no
history, so it confirms; the same trash icon on the canvas does not.

## Copy

- All user-facing text comes from `src/i18n/locales/`. No exceptions.
- Sentence case for labels and buttons. Buttons say what happens: "Add project",
  not "Submit".
- Errors say what went wrong and what to do, without apologising.

## Tables

Give `Table` a `rowKey` — never rely on array position. Only null, undefined and
empty string fall back to a dash; a zero is a value and displays as one. Wide
tables scroll inside their own container so the page body never scrolls
sideways.

## Charts

Read [DECISIONS.md](DECISIONS.md) before adding one. In short: one measure, one
hue; the ordinal ramp only for genuinely ordered categories; direct-label the
values; keep labels in ink colours; run the validator against both card
surfaces.

Every chart carries a table of the same figures, and the chart itself is
`aria-hidden` — so the numbers are read once, from the table, rather than as
loose SVG text. A "Show as table" toggle switches which one is visible. Name the
measure with `valueLabel`: a column headed "Value" tells a reader nothing that
"Progress" or "Tasks" would not.

## Dark mode

Every colour needs its dark counterpart — `dark:` on borders, backgrounds and
text. The shared components already handle it; hand-written markup must not
forget it. Check both themes before calling a screen done.

## Responsive

Content stacks below `lg`. The page body must never scroll horizontally: wide
tables and charts scroll within their own `overflow-x-auto` container. Check at
375px, where the sidebar collapses and the header actions wrap under the title.
