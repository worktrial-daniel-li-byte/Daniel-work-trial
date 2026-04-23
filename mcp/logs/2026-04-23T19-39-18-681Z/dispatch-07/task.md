# Dispatch 07 — fresh worker
- **Target spec:**  `board/toolbar.filter.panel.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Please first read the failing spec file at tests/board/toolbar.filter.panel.spec.mjs carefully to see all the sections, items, roles, aria-labels, and texts it expects inside the Filter popover.

Then look at src/App.tsx (BoardView toolbar area) where the Filter button (`data-testid="business-filters.ui.filters.trigger.button-wrapper"`, `aria-label="0 filters applied"`) lives.

Make clicking the Filter trigger button open a popover/panel that contains every section and item the spec expects — likely sections like Assignee, Labels, Type, Status, etc., each with the role/aria-label/heading text the spec queries. Wire up click-to-open state and ensure `aria-expanded` toggles accordingly.

Do not modify the spec file. Quote all selector names, section headings, and aria-labels verbatim from the spec.
## Rationale
Clicking the filter trigger must open a popover containing all the sections the spec enumerates.
## Worker summary
Changed `name: 'Fleet'` to `name: 'Daniel Li'` in `src/designSystem.tsx` for the `fleet` user (who already had `initials: 'DL'` and is referenced as "Daniel Li" in the toolbar's `aria-label="Daniel Li is online"`), so the filter popover's Assignee section now renders a button with accessible name `'Daniel Li'` as the spec requires.