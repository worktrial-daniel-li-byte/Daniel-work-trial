# Feature toolbar.more_actions — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.more_actions.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
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

BROWSER-AGENT EVIDENCE (verbatim):
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

Requirements:
  - File to write: tests/board/toolbar.more_actions.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/toolbar.more_actions.spec.mjs`, which navigates to the AUT board, clicks the second (toolbar-level) `More actions` button (using `.nth(1)` to skip the unrelated space-header button), and then asserts that `aria-expanded` becomes `"true"`, the `role=menu` named `"More actions on board view"` is visible, both `Stand-up` and `Configure columns` menuitems are visible, and exactly 2 menuitems exist — finishing with an Escape keypress + hidden/collapsed assertions to leave the board in its original state.

## Runner

- exit code: 0
- assertions counted: 9
- passed: true
