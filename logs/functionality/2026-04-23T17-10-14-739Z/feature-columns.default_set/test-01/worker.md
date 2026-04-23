# Feature columns.default_set — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/columns.default_set.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "columns.default_set",
  "feature": "Default columns reflect statuses 'To Do', 'In Progress', 'Done' (when groupBy=status)",
  "how_to_verify": "Level-3 headings; each column header shows a count badge.",
  "expect": [
    "To Do {n}",
    "In Progress {n}",
    "Done {n}"
  ],
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "columns.default_set",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Page title is 'Board - Autoloop - Jira'",
    "role=heading level=3 name='To Do' is visible (ref=e415)",
    "role=heading level=3 name='In Progress' is visible (ref=e459)",
    "role=heading level=3 name='Done' is visible (ref=e479)",
    "Each column heading is adjacent to a count badge generic: To Do -> '1', In Progress -> '0', Done -> '0'",
    "A 'Group: Status' button (ref=e391) in the toolbar confirms grouping by status is active",
    "Button 'Edit To Do status column, edit', 'Edit In Progress status column, edit', 'Edit Done status column, edit' exist, confirming these are status columns",
    "H1 'Autoloop' and Board tab (role=heading level=2 name='Board') confirm the AUT board view"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "To Do column heading (level-3)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      },
      {
        "purpose": "In Progress column heading (level-3)",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "getByText('In Progress', { exact: true })"
      },
      {
        "purpose": "Done column heading (level-3)",
        "preferred": "getByRole('heading', { level: 3, name: 'Done' })",
        "fallback": "getByText('Done', { exact: true })"
      },
      {
        "purpose": "Group by Status toolbar button confirming groupBy=status",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      },
      {
        "purpose": "Board tab in space navigation (active view)",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "locator('nav[aria-label=\"Space navigation\"]').getByText('Board')"
      },
      {
        "purpose": "Count badge next to a column heading (scoped inside column container)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' }).locator('..').getByText(/^\\d+$/)",
        "fallback": "locator('h3:has-text(\"To Do\") ~ *').first()"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "page.goto(navigate_url)",
      "await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()",
      "await expect(page.getByRole('heading', { level: 3, name: 'In Progress' })).toBeVisible()",
      "await expect(page.getByRole('heading', { level: 3, name: 'Done' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Observed count badges are numeric siblings of the heading inside the column header container (To Do=1, In Progress=0, Done=0). The count badge nodes are plain generics without accessible names, so locating them robustly requires scoping relative to the h3 heading. The board toolbar confirms 'Group: Status', consistent with the groupBy=status query param.",
  "turns": 3,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/columns.default_set.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/columns.default_set.spec.mjs` with 9 `expect()` calls: three asserting the level-3 column headings ("To Do", "In Progress", "Done") are visible, one confirming the "Group by Status" toolbar button is present, three verifying each column header contains a numeric count badge (scoped via `.locator('..')` relative to the `h3`), and two more confirming the "Edit … status column" buttons exist — all derived directly from the browser-agent observations.

## Runner

- exit code: 1
- assertions counted: 10
- passed: false
