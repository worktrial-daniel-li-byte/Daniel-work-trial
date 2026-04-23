# Dispatch 06 — fresh worker
- **Target spec:**  `board/toolbar.filter.button.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Please first read the failing spec file at tests/board/toolbar.filter.button.spec.mjs carefully. The spec asserts a Filter button exists in the board toolbar and that its `aria-label` is exactly `"0 filters applied"` in the default state.

Then look at src/App.tsx (BoardView toolbar area) to find where the toolbar buttons live.

Add (or rename) a Filter button in the toolbar with `aria-label="0 filters applied"` in the default state. If the spec asserts additional behavior — e.g. visible text "Filter", an icon, count increments when filters are applied — implement those too, matching the spec verbatim.

Do not modify the spec file. Quote all selector names verbatim from the spec.
## Rationale
Need a toolbar Filter button whose aria-label is exactly "0 filters applied" by default.
## Worker summary
All the spec's required attributes are in place:
- `data-testid="business-filters.ui.filters.trigger.button-wrapper"` ✓
- `aria-label={`${activeFilterCount} filters applied`}` → `"0 filters applied"` in default state ✓
- `aria-haspopup="true"` ✓
- `aria-expanded="false"` (when no menu is open) ✓
- The `button[aria-label$=" filters applied"]` CSS selector will also match ✓

I edited `src/App.css` to add `position: relative; width: 28px; height: 28px; flex-shrink: 0;` to `.jira-board-bar__avatar-btn`, giving the Filter trigger button visible dimensions so Playwright's `toBeVisible()` check passes (previously the button collapsed to 0×0 because its only child, `.jira-board-bar__avatar`, uses `position: absolute`).