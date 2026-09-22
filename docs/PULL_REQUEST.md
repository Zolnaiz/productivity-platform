# Pull request: `feat/design-system-adoption` → `main`

Ready to open. Everything below was verified on 2026-09-20 against the branch
head; `gh` is not authenticated in the environment these commits were written
in, so the pull request itself has to be opened by somebody who is signed in.

```bash
gh pr create --base main --head feat/design-system-adoption --title "Make the floor plan a floor plan, and the numbers true" --body-file docs/PULL_REQUEST.md
```

Or open it in the browser:
<https://github.com/Zolnaiz/productivity-platform/compare/main...feat/design-system-adoption>

## What this branch does

Seventy-one commits. Three threads run through them.

**The floor plan became a floor-plan tool.** It was rectangles floating in an
abstract canvas. It now has walls that meet at shared corners and close into
rooms with real areas; doors and windows cut into those walls, with the wall
rendered as the pieces left standing and a door carrying the quarter circle its
leaf sweeps; an object catalogue in metres — a desk 1.6 × 0.8 m, a EUR-1 pallet
1.2 × 0.8, a racking bay 2.7 × 1.1 — that snaps flush and square to walls;
corners you can drag, and drop on each other to close a room that never quite
closed; named rooms; and separate Grid, Snap and Dimensions switches where one
checkbox used to answer all three questions.

**Numbers that nothing produced were removed.** A new workspace was handed a
pre-drawn sample office as though it were its own building. A project's progress
was a slider somebody dragged, and the dashboard and the monthly report averaged
that figure as if it had been measured. Both are gone: an empty plan stays empty
and the editor asks how to begin, and a project counts its tasks. The monthly
report is now compiled person by person from what each of them actually
recorded.

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
- **Six of fourteen object types were refused by the validation pipe**, so a
  chair or a printer was placeable and unsaveable.
- **The demo user's id did not match the member list's id for the same person**,
  so everything the demo user did was recorded against somebody not on the
  staff list.

## Verification

Run on the branch head:

- Backend: 522 tests, lint clean, build clean, `npm audit` reports zero.
- Frontend: 710 tests, lint clean, build clean, `npm audit` reports zero.
- Migrations: all 18 apply to a fresh PGlite database; every mapped column
  exists, the schema is writable, and the partial unique index holds.
- The floor plan, the projects page, the monthly report and both themes were
  exercised in a browser against the dev server.

## Risk

Five migrations add columns to `five_s_layouts` (`corners`, `walls`,
`openings`, `metres_per_unit`, `room_labels`, `snap_to_grid`,
`show_dimensions`). All are additive with defaults; no column is dropped or
retyped, and an older client that does not send them still saves.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
