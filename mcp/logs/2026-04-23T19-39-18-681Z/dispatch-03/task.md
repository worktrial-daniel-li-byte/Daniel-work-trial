# Dispatch 03 — fresh worker
- **Target spec:**  `board/columns.create_in_column.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Please first read the failing spec file at tests/board/columns.create_in_column.spec.mjs to understand the exact selectors, fields, focus behavior, and Escape-key behavior it expects.

Then look at src/App.tsx (and any column/card components) to find where the per-column "Create" button lives. Each column already has a create button that should open an inline form inside the column with some set of fields (likely title/summary input, maybe type/priority, plus Create and Cancel). The spec asserts:
- Clicking the column's Create button opens an inline form with all expected fields
- The first field (likely the title/summary input) gets focus automatically
- Pressing Escape dismisses the form without persisting a new card

Implement whatever input/field names, roles, aria-labels, and placeholders the spec uses — quote them verbatim from the spec. Make sure the initial field receives focus (e.g. via `autoFocus` or a `useEffect(() => ref.current?.focus())`), and that Escape closes the form and doesn't add a card.

Do not modify the spec file.
## Rationale
Spec asserts the inline create-card form shows expected fields, auto-focuses the first field, and Escape cancels without persisting.
## Worker summary
No TypeScript errors. The implementation is complete.

I edited `src/App.tsx` to:
1. Added a new `InlineCreateForm` component (before `BoardView`) with a `<textarea aria-label="What needs to be done?" autoFocus>`, a "press Enter to submit" hint, buttons for "Select work type. Task currently selected.", "Due date", "Assignee: Unassigned", and "⏎ Create" (disabled when the textarea is empty), and an Escape key handler that calls `onClose`.
2. Added `inlineCreateColumnId` state to `BoardView` and changed the per-column Create button from `aria-label="Create issue"` / `+ Create` text to `aria-label="Create"` / `Create` text, with `onClick` setting `inlineCreateColumnId` to show the inline form in that column (and hiding the button until dismissed).