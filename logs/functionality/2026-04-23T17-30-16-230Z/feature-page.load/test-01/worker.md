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
    "Page title is exactly 'Board - Autoloop - Jira' (ends with 'Board - Autoloop - Jira')",
    "role=heading level=3 name='To Do' is visible in the board",
    "role=heading level=3 name='In Progress' is visible in the board",
    "role=heading level=3 name='Done' is visible in the board",
    "The 'To Do' column shows a count of '1' and contains card 'AUT-1 Design autonomous replanning loop'",
    "The 'In Progress' column shows a count of '0'",
    "The 'Done' column shows a count of '0'",
    "A 'Group: Status' button (aria-label 'Group by Status') confirms active grouping",
    "Space navigation lists 'Board' as a level-2 heading marking the active tab"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "To Do column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "locator('h3', { hasText: 'To Do' })"
      },
      {
        "purpose": "In Progress column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "locator('h3', { hasText: 'In Progress' })"
      },
      {
        "purpose": "Done column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Done' })",
        "fallback": "locator('h3', { hasText: 'Done' })"
      },
      {
        "purpose": "Space title confirming the Autoloop space loaded",
        "preferred": "getByRole('heading', { level: 1, name: 'Autoloop' })",
        "fallback": "getByText('Autoloop', { exact: true }).first()"
      },
      {
        "purpose": "Active Board tab (space navigation)",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "getByText('Board', { exact: true }).first()"
      },
      {
        "purpose": "Group-by Status indicator",
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
  "notes": "The space in this project is named 'Autoloop', so the title is 'Board - Autoloop - Jira'. All three status columns (To Do, In Progress, Done) rendered as h3 headings. Minor console errors/warnings observed but did not affect render. A 'Premium trial' button appears in the top navigation; no spotlight/dialog blocked interactions.",
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

I wrote `tests/board/page.load.spec.mjs` with six `expect()` assertions drawn directly from the browser-agent evidence: the page title regex (`/Board - Autoloop - Jira$/`), the three `h3` role-based column headings (`To Do`, `In Progress`, `Done`), the `Group by Status` button confirming active grouping, and the `Board` level-2 heading confirming the active navigation tab.

## Runner

- exit code: 0
- assertions counted: 6
- passed: true
