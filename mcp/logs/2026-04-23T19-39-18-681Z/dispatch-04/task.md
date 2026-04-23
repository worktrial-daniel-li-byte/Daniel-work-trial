# Dispatch 04 — fresh worker
- **Target spec:**  `board/columns.add_column.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
The spec tests/board/columns.add_column.spec.mjs is failing with `expect(locator).toHaveCount(expected)` after a recent change. Please read the spec file at tests/board/columns.add_column.spec.mjs carefully to see exactly which locator it asserts a count on and what count is expected.

Then look at src/App.tsx. The likely cause: the spec counts columns (e.g. via a role/data-testid/class) and something we added in the inline-create feature is now being counted as a column, OR the per-column "Create" button renaming now conflicts with the toolbar's "Create status" button in a locator.

Fix src/App.tsx so that:
- The original 3 status columns still render as the spec expects (matching its column locator).
- The "Create status" toolbar button and modal behavior from columns.add_column.spec continue to work.
- The inline per-column create-card flow (from columns.create_in_column.spec.mjs) still works — do NOT break that spec. Read tests/board/columns.create_in_column.spec.mjs too to make sure both specs are satisfied.

Use the exact locators/names/aria-labels/texts from both specs, quoted verbatim. Do not modify either spec file.
## Rationale
Previous change likely conflated column-count locator or button naming; must satisfy both add_column and create_in_column specs simultaneously.
## Worker summary
All changes are in place. Here's a summary of what was edited in `src/App.tsx`:

1. **Added `showCreateStatusModal` state** to track whether the Create Status dialog is open.
2. **Refactored `addColumn`** to open the modal instead of calling `window.prompt`; added `submitCreateStatus(title)` to actually add the column on form submit.
3. **Changed the "+" button** in `BoardView` to have `aria-label="Create status"` and an `<img alt="Create status" />` inside it — satisfying `button:has(img[alt="Create status"])` (count=1) and `toHaveAccessibleName('Create status')`.
4. **Added a `CreateStatusModal` component** with `role="dialog" aria-labelledby="create-status-modal-heading"`, an `<h1>Create status</h1>`, a textbox with `aria-label="Name"`, a select with `aria-label="Status category"`, a disabled-when-empty Submit button, and a Cancel button — satisfying all dialog assertions in `columns.add_column.spec.mjs` without touching the per-column `aria-label="Create"` buttons that `columns.create_in_column.spec.mjs` depends on.