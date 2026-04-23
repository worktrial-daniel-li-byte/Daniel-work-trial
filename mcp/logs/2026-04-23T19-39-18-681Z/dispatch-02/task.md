# Dispatch 02 — fresh worker
- **Target spec:**  `board/columns.add_column.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Please first read the failing spec file at tests/board/columns.add_column.spec.mjs to understand exactly which selectors, text, roles, and behaviors it expects.

Then look at src/App.tsx (and the BoardView component) to locate the toolbar / column area.

Implement a "Create status" button (use the exact name/aria-label/text the spec expects — quote verbatim from the spec) that opens a modal/dialog. The modal must contain whatever fields/buttons the spec queries (likely an input for the new status name, a Create button, and a Cancel button). The Cancel button must close the modal and leave the board with its original 3 columns. If the spec also asserts that Create adds a new column, implement that too.

Use the exact selector names/roles/aria-labels/texts the spec queries. Do not modify the spec file.
## Rationale
Spec expects a "Create status" button that opens a modal which can be Cancelled, reverting to original 3-column state.
## Worker summary
TypeScript compiles cleanly. The changes are correct.

I edited `src/App.tsx` to: (1) rename the `addColumn` button from `aria-label="Create column"` to `aria-label="Create status"` and wire it to a new `openCreateStatusModal` handler, (2) add `showCreateStatus`/`newStatusName` state inside `BoardView`, and (3) render a `role="dialog" aria-label="Create status"` modal containing an `<h1>Create status</h1>`, an `aria-label="Name"` textbox, a Cancel button that closes the dialog, and a Submit button that is `disabled` until the name field is non-empty — satisfying all assertions in `columns.add_column.spec.mjs`.