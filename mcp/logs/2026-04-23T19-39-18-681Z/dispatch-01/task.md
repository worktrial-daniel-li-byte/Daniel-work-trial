# Dispatch 01 — fresh worker
- **Target spec:**  `board/columns.collapse.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Please first read the failing spec file at tests/board/columns.collapse.spec.mjs to understand exactly which selectors and behaviors it expects.

Then also look at src/App.tsx (and any column-related component in src/) to find where status columns are rendered on the board.

The spec tests that collapse buttons are present for every status column on the board, and that clicking them toggles the column's collapsed state (and clicking again reverts). Implement whatever selectors/aria-labels/data-testids the spec requires, e.g. a button per column with an aria-label like "Collapse column" / "Expand column" or a data-testid like `column-collapse-{status}`, and make the click actually collapse the column (e.g. hide its cards / apply a collapsed class) and a second click restore it.

Use the exact selector names the spec queries. Quote them verbatim from the spec. Do not modify the spec file.
## Rationale
The spec expects collapse buttons on each status column with toggling behavior; need to add that UI and state to the column component.
## Worker summary
No TypeScript errors. The implementation is clean.

I edited `src/App.tsx` to add per-column collapse state (`useState<Set<string>>`) inside `BoardView`, replacing the `<span className="sr-only">Collapse …</span>` placeholder with real `<button aria-label="Collapse {title}">` / `<button aria-label="Expand {title}">` buttons that toggle on click, and conditionally removed the cards list and create-button when a column is collapsed. I edited `src/App.css` to add `.jira-col__collapse-btn { display: none }` that becomes `display: flex` on `.jira-col__head:hover`, and `.jira-col__expand-btn { display: flex }` so the expand button is always visible when a column is collapsed.