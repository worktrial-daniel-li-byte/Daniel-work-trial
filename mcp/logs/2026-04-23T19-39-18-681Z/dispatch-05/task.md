# Dispatch 05 — fresh worker
- **Target spec:**  `board/columns.more_actions.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Please first read the failing spec file at tests/board/columns.more_actions.spec.mjs to see exactly which selectors, aria-labels, menu items, roles, and behaviors it expects.

Then look at src/App.tsx (BoardView column header rendering) to find the column header area.

Add a "More actions" button per column header (use the exact aria-label and/or text the spec uses, quoted verbatim — likely `aria-label="More actions"` or `aria-label="More actions for {column title}"`). When clicked, it should open a menu (role="menu") containing the menu items the spec asserts for the "In Progress" column. Each menu item should use `role="menuitem"` with text/names matching verbatim what the spec queries.

Do not modify the spec file. Quote all selector names verbatim from the spec.
## Rationale
Need to add per-column More actions button that opens a menu with the specific items the spec expects.
## Worker summary
No TypeScript errors. The implementation is complete.

I edited `src/App.tsx` to add a `localColumnMenu` state and `useEffect` (Escape-to-close) to the `BoardView` component, and replaced the old `<span className="sr-only">` placeholder with a real `<button aria-label="More actions for column {title}">` that toggles a `<ul role="menu" aria-label="More actions for column {title}">` containing five `role="menuitem"` buttons matching the spec's expected names verbatim (`Add agent BETA`, `Rename status`, `Move column left`, `Move column right`, `Delete status`). I also edited `src/App.css` to add `.jira-col__menu` dropdown styles and a hover/expanded visibility rule for the trigger button.