# Feature toolbar.more_actions — mutation attempt 01
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/toolbar.more_actions.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "toolbar.more_actions",
  "feature": "Board-level More actions menu",
  "how_to_verify": "Click 'More actions'. Menu items rendered.",
  "expect_menu_items": [
    "Stand-up",
    "Configure columns"
  ],
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "toolbar.more_actions",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Page title is 'Board - Autoloop - Jira'",
    "In main content toolbar (next to 'View settings' and 'Group by Status'), a button with accessible name 'More actions' is visible (role=button, name='More actions')",
    "After clicking that button, its aria-expanded becomes true (role=button [expanded] [active] name='More actions')",
    "A menu appears with accessible name 'More actions on board view' (role=menu, name='More actions on board view')",
    "Menu contains menuitem with visible text 'Stand-up' (role=menuitem, name='Stand-up')",
    "Menu contains menuitem with visible text 'Configure columns' (role=menuitem, name='Configure columns')",
    "Both expected menu items are rendered as direct children of the menu group; exactly 2 menuitems observed",
    "Note: there is another unrelated 'More actions' button in the space header area (with an icon image) — the toolbar 'More actions' is the one near 'View settings'"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Board-level 'More actions' toolbar button (the one that opens the menu)",
        "preferred": "getByRole('button', { name: 'More actions', exact: true }).nth(1)",
        "fallback": "locator('button:has(span:text-is(\"More actions\"))')"
      },
      {
        "purpose": "The opened menu container",
        "preferred": "getByRole('menu', { name: 'More actions on board view' })",
        "fallback": "getByLabel('More actions on board view')"
      },
      {
        "purpose": "'Stand-up' menu item",
        "preferred": "getByRole('menuitem', { name: 'Stand-up' })",
        "fallback": "getByText('Stand-up', { exact: true })"
      },
      {
        "purpose": "'Configure columns' menu item",
        "preferred": "getByRole('menuitem', { name: 'Configure columns' })",
        "fallback": "getByText('Configure columns', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await page.getByRole('menu', { name: 'More actions on board view' }).waitFor({ state: 'hidden' }).catch(() => {})",
      "await page.getByRole('button', { name: 'More actions', exact: true }).nth(1).click()",
      "await expect(page.getByRole('menu', { name: 'More actions on board view' })).toBeVisible()",
      "await expect(page.getByRole('menuitem', { name: 'Stand-up' })).toBeVisible()",
      "await expect(page.getByRole('menuitem', { name: 'Configure columns' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "There are two buttons with accessible name 'More actions' on the page: (1) in the space header row next to 'Link contributing teams' (icon button, img 'More actions'), and (2) in the board view toolbar next to 'View settings'. The board-level button that opens the menu-of-interest is the SECOND occurrence; use .nth(1) or scope to the board toolbar (e.g. the ancestor containing 'View settings' / 'Group by Status'). Clicking it opens role=menu named exactly 'More actions on board view' with two menuitems: 'Stand-up' and 'Configure columns'. No mutation required.",
  "turns": 5,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/toolbar.more_actions.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
After thorough analysis of the source code, I can confirm the following:

1. **`src/App.tsx` has zero occurrences** of "Stand-up", "Configure columns", or "More actions on board view" — these are the three distinct markers the spec requires.

2. The board toolbar's "more" button (line 1427) has `aria-label="More board actions"` (not "More actions"), so `getByRole('button', { name: 'More actions', exact: true })` won't match it.

3. The `Popover` component in `src/designSystem.tsx` renders `role="menu"` without any `aria-label` support, so `getByRole('menu', { name: 'More actions on board view' })` can never match any local element.

4. The only elements with exact `aria-label="More actions"` in src/ are in the project-header area (line 991) and a sidebar sr-only button (line 2193) — neither is a board-toolbar "More actions" menu with "Stand-up" / "Configure columns" items.

**The "Board-level More actions menu" feature (with "Stand-up" and "Configure columns") lives exclusively in the live Jira tenant at `fleet-team-y0ak1u2s.atlassian.net`. It is not implemented in `src/` at all.** The browser evidence was captured against the live URL; when the spec runs locally via the route-map shim (JIRA_BASE_URL=localhost), the required elements simply don't exist in the local SPA. No edits are warranted.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified