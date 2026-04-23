# Feature page.load — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/page.load.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "page.load",
  "feature": "Route renders board with Status columns when /board?groupBy=status",
  "how_to_verify": "Navigate to /jira/core/projects/{key}/board?filter=&groupBy=status",
  "expect": "Page title ends with 'Board - {Space} - Jira'. Level-3 headings 'To Do', 'In Progress', 'Done' are present.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "page.load",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "document.title === 'Board - Autoloop - Jira' (ends with 'Board - Autoloop - Jira')",
    "role=heading level=3 name=\"To Do\" is visible (column header with count '1')",
    "role=heading level=3 name=\"In Progress\" is visible (column header with count '0')",
    "role=heading level=3 name=\"Done\" is visible (column header with count '0')",
    "role=heading level=1 name=\"Autoloop\" is visible as the space title",
    "role=heading level=2 name=\"Board\" is visible in the space navigation tabs",
    "Button 'Group by Status' is present with visible text 'Group: Status'"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "To Do status column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      },
      {
        "purpose": "In Progress status column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "getByText('In Progress', { exact: true })"
      },
      {
        "purpose": "Done status column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Done' })",
        "fallback": "getByText('Done', { exact: true })"
      },
      {
        "purpose": "Space (project) title",
        "preferred": "getByRole('heading', { level: 1, name: 'Autoloop' })",
        "fallback": "getByText('Autoloop', { exact: true })"
      },
      {
        "purpose": "Active Board tab in space navigation",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "getByText('Board', { exact: true })"
      },
      {
        "purpose": "Group-by control indicating Status grouping",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page).toHaveTitle(/Board - Autoloop - Jira$/)"
    ],
    "mutation_and_revert": null
  },
  "notes": "Page loaded fully authenticated (no login redirect). Status columns are rendered as role=heading level=3 with exact names 'To Do', 'In Progress', 'Done'. Column counts (1/0/0) are sibling generic elements, not part of the heading accessible name. Two console errors and five warnings were observed but none blocked rendering.",
  "turns": 3,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/page.load.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/page.load.spec.mjs` with six `expect()` assertions: the page title matching `/Board - Autoloop - Jira$/`, three level-3 status column headings (`To Do`, `In Progress`, `Done`), the level-1 space heading `Autoloop`, and the `Group by Status` button — all derived directly from the browser-agent evidence.

## Runner

- exit code: 0
- assertions counted: 6
- passed: true
