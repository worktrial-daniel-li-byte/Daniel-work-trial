# Feature toolbar.filter.button — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.filter.button.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.filter.button",
  "feature": "Filter button shows active count",
  "how_to_verify": "Snapshot: role=button name matches /^\\d+ filters applied$/. Default is '0 filters applied'.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.filter.button",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Page title is 'Board - Autoloop - Jira'",
    "role=button with accessible name '0 filters applied' is visible in the board toolbar (ref=e383)",
    "The same button has visible text 'Filter' (inner span labelled 'Filter')",
    "The button's DOM attribute aria-label equals exactly '0 filters applied' (regex /^\\d+ filters applied$/ matches)",
    "The button has data-testid='business-filters.ui.filters.trigger.button-wrapper'",
    "The button has aria-haspopup='true' and aria-expanded='false' (filter popup trigger)",
    "Adjacent controls observed in the same toolbar row: 'Group by Status' button, 'View settings' button, 'More actions' button, 'Filter by assignee' group, 'Search board' textbox",
    "Board columns visible: heading level=3 'To Do' (count 1), 'In Progress' (count 0), 'Done' (count 0), confirming board loaded (not login page)"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Filter trigger button with active-count accessible name",
        "preferred": "getByRole('button', { name: '0 filters applied' })",
        "fallback": "getByTestId('business-filters.ui.filters.trigger.button-wrapper')"
      },
      {
        "purpose": "Filter trigger button matched by regex for any count",
        "preferred": "getByRole('button', { name: /^\\d+ filters applied$/ })",
        "fallback": "locator('button[aria-label$=\"filters applied\"]')"
      },
      {
        "purpose": "Board page loaded sanity anchor (To Do column)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "page.goto(navigate_url)",
      "await expect(page.getByRole('button', { name: '0 filters applied' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: /^\\d+ filters applied$/ })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Feature check is fully satisfied in default state: the button's accessible name is literally '0 filters applied', matching the /^\\d+ filters applied$/ regex. Visible label is 'Filter'; the numeric state lives only in aria-label, so getByRole name matching (not getByText) is the correct strategy. No mutation was required. Two unrelated console errors and six warnings were emitted on load but did not affect the filter button rendering.",
  "turns": 4,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.filter.button.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/toolbar.filter.button.spec.mjs`, which navigates to the AUT board and asserts: (1) the "To Do" column heading is visible (board-load sanity), (2) a button with accessible name `"0 filters applied"` is visible, (3) the same button matches the general regex `/^\d+ filters applied$/`, and (4) the button carries `aria-haspopup="true"` and `aria-expanded="false"` confirming it is the collapsed filter-popup trigger in its default state.

## Runner

- exit code: 0
- assertions counted: 6
- passed: true
