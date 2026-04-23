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
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Page title is 'Board - Autoloop - Jira'",
    "Snapshot shows 'textbox \"Search board\" [ref=e381]' inside the board toolbar region",
    "DOM inspection: element is an <INPUT type=\"text\"> with aria-label=\"Search board\" and placeholder=\"Search board\", visible on screen",
    "Adjacent status element reads 'Showing all work items', confirming the textbox sits in the board filter toolbar",
    "Nearby toolbar controls are visible: button 'Filter' ('0 filters applied'), button 'Group: Status', button 'View settings', button 'More actions'",
    "Main board columns render: heading level=3 'To Do', heading level=3 'In Progress', heading level=3 'Done'"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "The 'Search board' toolbar textbox",
        "preferred": "getByRole('textbox', { name: 'Search board' })",
        "fallback": "getByPlaceholder('Search board')"
      },
      {
        "purpose": "Status text next to the search input",
        "preferred": "getByText('Showing all work items')",
        "fallback": "locator('[role=\"status\"]', { hasText: 'Showing all work items' })"
      },
      {
        "purpose": "Board page confirmation (active Board tab)",
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
  "notes": "Element is a native <input type=\"text\"> with aria-label=\"Search board\" (also placeholder=\"Search board\"), so getByRole('textbox', { name: 'Search board' }) is the correct accessible locator. No mutation required for this check.",
  "turns": 4,
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

I wrote `tests/board/toolbar.search.present.spec.mjs` with four `expect()` assertions: the primary role-based `getByRole('textbox', { name: 'Search board' })` visibility check, a redundant placeholder-based check on the same `<input>`, confirmation that the adjacent `"Showing all work items"` status text is visible, and that the nearby `Filter` button is present — all derived directly from the browser-agent observations.

## Runner

- exit code: 1
- assertions counted: 4
- passed: false
