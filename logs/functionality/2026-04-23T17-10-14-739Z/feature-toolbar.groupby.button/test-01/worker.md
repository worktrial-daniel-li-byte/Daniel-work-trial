# Feature toolbar.groupby.button — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.groupby.button.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.groupby.button",
  "feature": "Group by button reflects current grouping",
  "how_to_verify": "Snapshot: role=button name='Group by {Field}'. Default name='Group by Status'.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.groupby.button",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "A button with accessible name (aria-label) 'Group by Status' is visible in the board toolbar",
    "The visible text inside that button is 'Group: Status' (span.css-178ag6o)",
    "The button has aria-haspopup='true' and aria-expanded='false' indicating it opens a menu",
    "Board columns reflect status grouping: headings 'To Do' (level=3), 'In Progress' (level=3), 'Done' (level=3) are rendered",
    "Neighboring toolbar buttons 'View settings' and 'More actions' exist alongside the Group by button",
    "heading level=1 'Autoloop' and heading level=2 'Board' confirm we are on the Autoloop board view"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Group by button reflecting current grouping (default: Status)",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      },
      {
        "purpose": "Visible label span inside the Group by button",
        "preferred": "getByRole('button', { name: 'Group by Status' }).getByText('Group: Status')",
        "fallback": "locator('button[aria-label=\"Group by Status\"] span')"
      },
      {
        "purpose": "To Do column heading (confirms status grouping is active)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      },
      {
        "purpose": "In Progress column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "getByText('In Progress', { exact: true })"
      },
      {
        "purpose": "Done column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Done' })",
        "fallback": "getByText('Done', { exact: true })"
      }
    ],
    "url_assertions": [
      "groupBy=status"
    ],
    "interactions": null,
    "mutation_and_revert": null
  },
  "notes": "Accessible name of the button is 'Group by Status' (from aria-label); visible text within the button is 'Group: Status'. Both are valid assertions; prefer the role+name locator. No mutation required for this check. Console reported 2 errors/6 warnings but none affected rendering of the toolbar.",
  "turns": 4,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.groupby.button.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/toolbar.groupby.button.spec.mjs`, which asserts (1) the toolbar button is visible with the accessible name `"Group by Status"` and contains the visible text `"Group: Status"`, (2) the button carries `aria-haspopup="true"` / `aria-expanded="false"` confirming it is a collapsed popup trigger, and (3) the three status-grouping column headings (`To Do`, `In Progress`, `Done`) are all rendered on the board.

## Runner

- exit code: 0
- assertions counted: 9
- passed: true
