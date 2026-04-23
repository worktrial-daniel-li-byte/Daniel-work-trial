# Dispatch 02 — fresh worker
- **Target spec:**  `board/columns.collapse.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Read the failing spec at tests/board/columns.collapse.spec.mjs to see the exact selectors (role/aria-label/data-testid/text) it looks for, and also inspect src/App.tsx (or the board column component under src/) to find the status columns.

Add a collapse button to every status column header. PREFER adding aria-label / role / data-testid / text over restructuring JSX/CSS. Do NOT remove or rewrap existing elements — add only the minimal new button(s).

The spec likely:
  1. Finds a collapse button per column (e.g., `getByRole('button', { name: /collapse|expand .* column/i })` or a `data-testid`).
  2. Clicks it, asserts some state change (e.g., `aria-expanded` toggled, or a class / attribute on the column, or the column labeled collapsed).
  3. Clicks again to revert.

Match the spec's locators EXACTLY. Implement the toggle with React state so clicking flips `aria-expanded` (or whatever attribute/text the spec checks) and clicking again reverts it. Keep each column's existing markup intact; just insert the button inside the existing column header and wire up minimal state.
## Rationale
Spec expects each status column to have a collapse toggle button that updates state and reverts.
## Worker summary
I edited `src/App.tsx` to insert a collapse/expand `<button>` (with aria-label `"Collapse [title]"` or `"Expand [title]"` based on state) into every column header, wired to the existing `toggleCollapse` function, and edited `src/App.css` to hide the button by default (opacity 0), reveal it on `.jira-col__head:hover`, and keep it always visible when the column has the `.jira-col--collapsed` class.