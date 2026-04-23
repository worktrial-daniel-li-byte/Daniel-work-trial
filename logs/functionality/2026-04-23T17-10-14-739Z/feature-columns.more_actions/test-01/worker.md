# Feature columns.more_actions — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/columns.more_actions.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "columns.more_actions",
  "feature": "Per-column More actions menu",
  "how_to_verify": "Click 'More actions for column {Status}'. Menu items rendered.",
  "expect_menu_items": [
    "Add agent (BETA)",
    "Rename status",
    "Move column right",
    "Delete status"
  ],
  "notes": "'Move column right' is replaced/augmented with 'Move column left' for non-leftmost columns (not directly verified).",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "columns.more_actions",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "heading level=3 with name 'In Progress' is visible in the board",
    "button with accessible name 'More actions for column In Progress' is visible next to the In Progress heading",
    "Clicking 'More actions for column In Progress' opens a role=menu with accessible name 'More actions for column In Progress' (button becomes aria-expanded=true)",
    "menuitem with accessible name 'Add agent BETA' is visible (text 'Add agent' with a 'BETA' badge)",
    "menuitem with accessible name 'Rename status' is visible",
    "menuitem with accessible name 'Move column left' is visible (because In Progress is a middle column)",
    "menuitem with accessible name 'Move column right' is visible",
    "menuitem with accessible name 'Delete status' is visible",
    "Board also has buttons 'More actions for column Done' and a collapsed 'Expand To Do' (To Do column is collapsed in this session)",
    "Menu items are grouped into three role=group sections: [Add agent, Rename status], [Move column left, Move column right], [Delete status]"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "In Progress column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "getByText('In Progress', { exact: true })"
      },
      {
        "purpose": "Per-column More actions trigger button (In Progress)",
        "preferred": "getByRole('button', { name: 'More actions for column In Progress' })",
        "fallback": "locator('button[aria-label=\"More actions for column In Progress\"]')"
      },
      {
        "purpose": "Opened menu for column actions",
        "preferred": "getByRole('menu', { name: 'More actions for column In Progress' })",
        "fallback": "locator('[role=\"menu\"]')"
      },
      {
        "purpose": "Menu item: Add agent (BETA)",
        "preferred": "getByRole('menuitem', { name: 'Add agent BETA' })",
        "fallback": "getByRole('menuitem').filter({ hasText: 'Add agent' })"
      },
      {
        "purpose": "Menu item: Rename status",
        "preferred": "getByRole('menuitem', { name: 'Rename status' })",
        "fallback": "getByText('Rename status', { exact: true })"
      },
      {
        "purpose": "Menu item: Move column left",
        "preferred": "getByRole('menuitem', { name: 'Move column left' })",
        "fallback": "getByText('Move column left', { exact: true })"
      },
      {
        "purpose": "Menu item: Move column right",
        "preferred": "getByRole('menuitem', { name: 'Move column right' })",
        "fallback": "getByText('Move column right', { exact: true })"
      },
      {
        "purpose": "Menu item: Delete status",
        "preferred": "getByRole('menuitem', { name: 'Delete status' })",
        "fallback": "getByText('Delete status', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await page.getByRole('button', { name: 'More actions for column In Progress' }).click()",
      "await expect(page.getByRole('menuitem', { name: 'Add agent BETA' })).toBeVisible()",
      "await expect(page.getByRole('menuitem', { name: 'Rename status' })).toBeVisible()",
      "await expect(page.getByRole('menuitem', { name: 'Move column right' })).toBeVisible()",
      "await expect(page.getByRole('menuitem', { name: 'Delete status' })).toBeVisible()",
      "await page.keyboard.press('Escape')"
    ],
    "mutation_and_revert": null
  },
  "notes": "Verified against the In Progress column (a middle column), which exposes BOTH 'Move column left' and 'Move column right' simultaneously; this confirms the note that left/right vary by column position. The To Do column was rendered collapsed (only an 'Expand To Do' button visible), so its More actions trigger was not available without expanding; the spec should target 'In Progress' where all expected items are guaranteed to render. The Add agent item is labelled 'Add agent BETA' (the BETA suffix comes from a badge inside the item); using exact name 'Add agent (BETA)' will NOT match — use 'Add agent BETA' or hasText 'Add agent'.",
  "turns": 6,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/columns.more_actions.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/columns.more_actions.spec.mjs` with 10 `expect()` assertions: it navigates to the board, hovers the "In Progress" heading to reveal the trigger, clicks "More actions for column In Progress", then verifies the button becomes `aria-expanded="true"`, the `role=menu` appears, all five expected menu items are visible (`Add agent BETA`, `Rename status`, `Move column left`, `Move column right`, `Delete status`), and finally confirms the menu is dismissed after pressing Escape.

## Runner

- exit code: 0
- assertions counted: 10
- passed: true
