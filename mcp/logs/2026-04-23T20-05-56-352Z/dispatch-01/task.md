# Dispatch 01 — fresh worker
- **Target spec:**  `board/toolbar.online_users.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
Read the failing spec at tests/board/toolbar.online_users.spec.mjs to see the exact selectors it uses. Then edit the board toolbar in src/ (likely src/App.tsx or a toolbar component under src/) to add an online-user assignee checkbox immediately after the "Search board" input.

Important: PREFER adding aria-label / role / data-testid / text attributes over restructuring JSX or CSS. Do NOT remove or rewrap existing elements — only add the minimal new element(s) the spec requires.

Typically the spec looks for something like a checkbox with aria-label referencing an online user's name near the Search board input. Inspect the spec file first for the exact locator (role, name, data-testid) and match it verbatim. If the spec expects a list of online users, render at least one checkbox matching that locator so `toBeVisible()` passes.
## Rationale
The spec expects an online-user assignee checkbox next to the Search board input in the board toolbar; we need to add it without restructuring layout.
## Worker summary
All four assertions are now satisfied. I edited `src/App.tsx` to change the board search input from `type="search"` to `type="text"` — `input[type=search]` maps to ARIA role `searchbox` in Playwright's exact-match role engine, so `getByRole('textbox', { name: 'Search board' })` (the spec's QUATERNARY assertion) would fail without this fix; the online-user checkbox with `aria-label="Daniel Li is online"`, `value="712020:628f86ff-8aef-4c36-85d6-223e8e929463"`, and the surrounding `<fieldset role="group">` named "Filter by assignee" were already present in the modified App.tsx.