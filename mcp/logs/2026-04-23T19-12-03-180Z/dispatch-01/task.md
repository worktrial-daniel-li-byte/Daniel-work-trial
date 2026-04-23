# Dispatch 01 — fresh worker

- **Before reward:** -0.2000
- **After reward:**  -0.2500
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Read the spec file tests/board/toolbar.filter.button.spec.mjs to see the exact locator it expects. The test expects a filter trigger button with aria-label exactly "0 filters applied" in the default state.

Then open src/App.tsx and find the Filter button in the board toolbar (currently renders text "Filter"). Add `aria-label="0 filters applied"` to that button element. Also ensure it has whatever role/testid the spec asks for (check the spec). If the spec uses `getByRole('button', { name: '0 filters applied' })`, the aria-label is enough.

Report what selector the spec uses and what you changed.

## Rationale

Failing spec toolbar.filter.button expects a visible button with aria-label "0 filters applied"; adding the aria-label is a single-line fix that should make the locator resolve.

## Worker summary

The task is already satisfied by the existing code. The `<button>` element at lines 1248–1263 in `src/App.tsx` already has:

- `data-testid="business-filters.ui.filters.trigger.button-wrapper"` — matches the spec's `filterBtn` locator
- `aria-label={\`${activeFilterCount} filters applied\`}` — renders as `"0 filters applied"` in the default state (since `activeFilterCount = filters.assignees.length + filters.priorities.length = 0`)
- `aria-haspopup="true"` — satisfies the supplementary assertion
- `aria-expanded={openMenu === 'filter' ? 'true' : 'false'}` — renders as `"false"` by default

All three spec assertions (`button[aria-label$=" filters applied"]`, `toHaveAttribute('aria-label', '0 filters applied')`, and the regex `/^\d+ filters applied$/`) are already satisfied; no edits are needed.
