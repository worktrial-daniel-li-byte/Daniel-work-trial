# Feature toolbar.groupby.options — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.groupby.options.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.groupby.options",
  "feature": "Group by options",
  "how_to_verify": "Click Group by. Popover shows 4 radios.",
  "expect_radios": [
    "Assignee",
    "Category",
    "Priority",
    "Status"
  ],
  "default_checked": "Status",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.groupby.options",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Toolbar button role=button has accessible name 'Group by Status' with visible text 'Group: Status'",
    "Clicking the 'Group by Status' button sets its aria-expanded to true and reveals a role=radiogroup with accessible name 'Group by field'",
    "The radiogroup contains exactly 4 radios in this order: 'Assignee', 'Category', 'Priority', 'Status Selected'",
    "radio 'Assignee' is present (not checked)",
    "radio 'Category' is present (not checked)",
    "radio 'Priority' is present (not checked)",
    "radio 'Status Selected' is the currently [checked] radio (default selection matches ?groupBy=status URL)",
    "The Status radio also contains an inline img with alt text 'Selected' indicating the selected state"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Group by toolbar trigger button",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      },
      {
        "purpose": "Group by popover radio group",
        "preferred": "getByRole('radiogroup', { name: 'Group by field' })",
        "fallback": "locator('[role=\"radiogroup\"]')"
      },
      {
        "purpose": "Assignee radio option",
        "preferred": "getByRole('radio', { name: 'Assignee' })",
        "fallback": "getByText('Assignee', { exact: true })"
      },
      {
        "purpose": "Category radio option",
        "preferred": "getByRole('radio', { name: 'Category' })",
        "fallback": "getByText('Category', { exact: true })"
      },
      {
        "purpose": "Priority radio option",
        "preferred": "getByRole('radio', { name: 'Priority' })",
        "fallback": "getByText('Priority', { exact: true })"
      },
      {
        "purpose": "Status radio option (default-checked)",
        "preferred": "getByRole('radio', { name: /^Status/ })",
        "fallback": "getByRole('radio', { name: 'Status Selected' })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.getByRole('button', { name: 'Group by Status' }).click();",
      "await expect(page.getByRole('radiogroup', { name: 'Group by field' })).toBeVisible();",
      "await expect(page.getByRole('radiogroup', { name: 'Group by field' }).getByRole('radio')).toHaveCount(4);",
      "await expect(page.getByRole('radio', { name: 'Assignee' })).toBeVisible();",
      "await expect(page.getByRole('radio', { name: 'Category' })).toBeVisible();",
      "await expect(page.getByRole('radio', { name: 'Priority' })).toBeVisible();",
      "await expect(page.getByRole('radio', { name: /^Status/ })).toBeChecked();"
    ],
    "mutation_and_revert": null
  },
  "notes": "The Status radio's accessible name is 'Status Selected' (includes the 'Selected' img alt). Use a regex like /^Status/ or the exact 'Status Selected' name when targeting it. The radiogroup has accessible name 'Group by field'. Popover opens inline (button aria-expanded toggles to true); no extra dialog role. Two unrelated console errors/6 warnings were present on load but did not affect interactions.",
  "turns": 5,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.groupby.options.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/board/toolbar.groupby.options.spec.mjs`. The primary assertions verify that clicking the "Group by Status" button expands a `radiogroup` named "Group by field" containing exactly 4 radios (Assignee, Category, Priority, Status), that the Status radio is `checked` by default (matched with `/^Status/` to handle the "Status Selected" accessible name), and that the popover collapses cleanly on Escape — leaving the board in its original state.

## Runner

- exit code: 0
- assertions counted: 14
- passed: true
