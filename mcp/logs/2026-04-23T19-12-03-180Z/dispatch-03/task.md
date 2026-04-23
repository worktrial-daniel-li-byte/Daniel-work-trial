# Dispatch 03 — fresh worker

- **Before reward:** -0.1765
- **After reward:**  -0.1765
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Fix the failing spec `tests/board/toolbar.online_users.spec.mjs`. 

Step 1: Read the spec file fully at `tests/board/toolbar.online_users.spec.mjs` to see the exact locator and assertions. Note any data-testid, role, or aria-label it uses.

Step 2: Run it and capture output:
`npx playwright test tests/board/toolbar.online_users.spec.mjs --reporter=line 2>&1 | tail -40`

Step 3: Open `src/App.tsx`. Find the board toolbar (near the Search board input and Filter button). The spec expects an "Online-user assignee checkbox" visible in the toolbar next to Search board — this is likely a user avatar rendered as a checkbox (role=checkbox with aria-label like "Assignee: …" or similar).

Step 4: Make the minimum change in src/App.tsx (and src/App.css if needed) to satisfy the spec. Add the missing element with the exact data-testid / role / aria-label the spec uses.

Report the exact locator the spec uses and the exact JSX you added.

## Rationale

online_users spec expects an assignee checkbox visible in the toolbar — currently our toolbar only has the search/avatar/filter group. Adding the element with the correct role/aria/testid the spec demands should make it visible and pass.

## Worker summary

The spec `tests/board/toolbar.online_users.spec.mjs` is already passing (1 passed in 4.4s) — no changes were needed. The toolbar already renders the `role=checkbox` with `aria-label="Daniel Li is online"`, the correct `value` attribute, and the `role=group aria-label="Filter by assignee"` wrapper alongside the `Search board` textbox.
