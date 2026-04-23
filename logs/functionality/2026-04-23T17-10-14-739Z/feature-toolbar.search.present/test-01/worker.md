# Feature toolbar.search.present — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.search.present.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.search.present",
  "feature": "Toolbar has a 'Search board' textbox",
  "how_to_verify": "Snapshot: role=textbox name='Search board'",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.search.present",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
    "Page title is 'Board - Autoloop - Jira'",
    "role=textbox with accessible name 'Search board' is present inside the board toolbar (ref=e407)",
    "Adjacent status element reads 'Showing all work items' (ref=e408), confirming it is the board search toolbar",
    "Toolbar also shows 'Group by Status' button and 'View settings' button, confirming toolbar context",
    "Column heading role=heading level=3 name='To Do' is visible on the board"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Search board textbox in the board toolbar",
        "preferred": "getByRole('textbox', { name: 'Search board' })",
        "fallback": "locator('input[placeholder=\"Search board\"]')"
      },
      {
        "purpose": "Adjacent status indicator that confirms toolbar context",
        "preferred": "getByText('Showing all work items')",
        "fallback": "locator('[role=status]', { hasText: 'Showing all work items' })"
      },
      {
        "purpose": "Board view heading (page context)",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "getByText('Board', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('textbox', { name: 'Search board' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Textbox is observed with no initial value; it is a plain input (not combobox). The accessible name 'Search board' comes from the element itself. Page already authenticated as worktrial-daniel-li@fleet.so; no login redirect occurred.",
  "turns": 15,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.search.present.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/toolbar.search.present.spec.mjs` with four `expect()` calls: the primary role-based assertion that `getByRole('textbox', { name: 'Search board' })` is visible, plus corroborating assertions on the adjacent `'Showing all work items'` status text, the `'Group by Status'` toolbar button, and the `'To Do'` column heading — all drawn directly from the browser-agent observations.

## Runner

- exit code: 1
- assertions counted: 4
- passed: false
