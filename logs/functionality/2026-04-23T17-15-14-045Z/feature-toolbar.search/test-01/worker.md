# Feature toolbar.search — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/calendar/toolbar.search.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.search",
  "feature": "Calendar search textbox filters work items on the calendar",
  "how_to_verify": "Assert a textbox with accessible name 'Search calendar' is present in the toolbar.",
  "expect": "Search calendar",
  "action_is_mutating": false,
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.search",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar",
  "observations": [
    "page.url() === https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar",
    "page title is 'Calendar - Jira'",
    "A textbox with accessible name 'Search calendar' is present in the calendar toolbar (snapshot ref=e491)",
    "The underlying element is <input type=\"text\"> with aria-label=\"Search calendar\" and placeholder=\"Search calendar\", and it is visible (offsetParent !== null)",
    "Helper text immediately preceding the input reads: 'On entering data into the following input field, the calendar content will update below.'",
    "The textbox sits in the toolbar next to the 'Filter by assignee' group and '0 filters applied' Filter button, above the calendar grid whose heading is 'Apr 2026'",
    "Calendar heading 'Autoloop' (h1) and space-nav heading 'Calendar' (h2) confirm we are on the AUT project calendar"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Calendar search textbox in the toolbar",
        "preferred": "getByRole('textbox', { name: 'Search calendar' })",
        "fallback": "getByPlaceholder('Search calendar')"
      },
      {
        "purpose": "Current month heading (confirms calendar loaded before asserting)",
        "preferred": "getByRole('heading', { level: 3, name: /\\b\\d{4}\\b/ })",
        "fallback": "locator('h3')"
      },
      {
        "purpose": "Space/project title confirming AUT project",
        "preferred": "getByRole('heading', { level: 1, name: 'Autoloop' })",
        "fallback": "getByText('Autoloop')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/calendar"
    ],
    "interactions": null,
    "mutation_and_revert": null
  },
  "notes": "The search input exposes accessible name 'Search calendar' via aria-label (also duplicated as placeholder), so getByRole('textbox', { name: 'Search calendar' }) is the cleanest locator. No mutation required — this check only asserts presence. Unscheduled-work panel has a separate textbox named 'Search field for unscheduled items...'; do not confuse the two.",
  "turns": 4,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/calendar/toolbar.search.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/calendar/toolbar.search.spec.mjs` with four `expect()` assertions: it verifies the page URL matches `/jira/core/projects/AUT/calendar`, that the calendar month heading (confirming the grid is rendered) is visible, that `getByRole('textbox', { name: 'Search calendar' })` is visible in the toolbar, and that the AUT project heading `'Autoloop'` is present — with a bonus fallback check via `getByPlaceholder('Search calendar')`.

## Runner

- exit code: 0
- assertions counted: 5
- passed: true
