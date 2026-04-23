# Feature toolbar.search.filters_cards — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.search.filters_cards.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.search.filters_cards",
  "feature": "Typing in 'Search board' filters cards and persists in URL",
  "how_to_verify": "Fill 'Search board' with 'zzznomatch'. All columns show count 0; empty state heading 'No search results' with subtitle 'Try a different word, phrase or filter.' and a 'Clear' button.",
  "expect_url_contains": "filter=(summary%20~%20'{q}*'%20OR%20description%20~%20'{q}*')",
  "notes": "Search matches summary and description with a trailing wildcard. Clearing the textbox alone does NOT reset the URL filter; use the empty-state 'Clear' button or the X inside the search input.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.search.filters_cards",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "Before typing, URL is https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
    "Initial column counts are To Do=1, In Progress=0, Done=0 (heading level=3 'To Do' sibling text '1')",
    "textbox with accessible name 'Search board' is present (ref=e381)",
    "After fill('zzznomatch'), URL becomes https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=(summary%20~%20%27zzznomatch*%27%20OR%20description%20~%20%27zzznomatch*%27)&groupBy=status",
    "All three column count badges now show '0' (heading level=3 'To Do' sibling '0'; 'In Progress' sibling '0'; 'Done' sibling '0')",
    "Empty state renders heading level=2 with exact text 'No search results'",
    "Empty state renders paragraph with exact text 'Try a different word, phrase or filter.'",
    "Empty state renders a button with accessible name 'Clear filters' (not 'Clear'); additionally an X clear button with accessible name 'Clear' appears inside the search textbox",
    "Status region updates from 'Showing all work items' to 'Showing filtered work items'",
    "Clicking the 'Clear filters' button reverts the URL to https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status and restores To Do=1"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Search board input",
        "preferred": "getByRole('textbox', { name: 'Search board' })",
        "fallback": "locator('input[aria-label=\"Search board\"]')"
      },
      {
        "purpose": "To Do column heading",
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
      },
      {
        "purpose": "Empty-state heading",
        "preferred": "getByRole('heading', { level: 2, name: 'No search results' })",
        "fallback": "getByText('No search results')"
      },
      {
        "purpose": "Empty-state subtitle",
        "preferred": "getByText('Try a different word, phrase or filter.')",
        "fallback": "locator('p', { hasText: 'Try a different word, phrase or filter.' })"
      },
      {
        "purpose": "Empty-state Clear filters button",
        "preferred": "getByRole('button', { name: 'Clear filters' })",
        "fallback": "getByText('Clear filters')"
      },
      {
        "purpose": "X clear button inside search input",
        "preferred": "getByRole('button', { name: 'Clear', exact: true })",
        "fallback": "locator('button[aria-label=\"Clear\"]')"
      },
      {
        "purpose": "Status region describing filter state",
        "preferred": "getByRole('status')",
        "fallback": "getByText('Showing filtered work items')"
      }
    ],
    "url_assertions": [
      "filter=&groupBy=status (initial and after Clear filters)",
      "filter=(summary%20~%20%27zzznomatch*%27%20OR%20description%20~%20%27zzznomatch*%27)&groupBy=status (after typing)",
      "regex: /filter=\\(summary%20~%20%27zzznomatch\\*%27%20OR%20description%20~%20%27zzznomatch\\*%27\\)/"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await page.getByRole('textbox', { name: 'Search board' }).click()",
      "await page.getByRole('textbox', { name: 'Search board' }).fill('zzznomatch')",
      "await expect(page).toHaveURL(/filter=\\(summary%20~%20%27zzznomatch\\*%27%20OR%20description%20~%20%27zzznomatch\\*%27\\)/)",
      "await expect(page.getByRole('heading', { level: 2, name: 'No search results' })).toBeVisible()",
      "await expect(page.getByText('Try a different word, phrase or filter.')).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()",
      "await page.getByRole('button', { name: 'Clear filters' }).click()",
      "await expect(page).toHaveURL(/filter=&groupBy=status/)"
    ],
    "mutation_and_revert": null
  },
  "notes": "Feature spec text said the button label is 'Clear', but the actual accessible name of the empty-state button is 'Clear filters'. A separate X button with accessible name 'Clear' does appear inside the search input. Status region exposes 'Showing filtered work items' vs 'Showing all work items' which is a useful assertion. Sidebar and nav snapshot contained many unrelated elements; only relevant locators are listed. Note the URL uses url-encoded single quotes (%27) and spaces (%20).",
  "turns": 8,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.search.filters_cards.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The file `tests/board/toolbar.search.filters_cards.spec.mjs` has been written with a full mutate→verify→revert→verify flow: it fills the search with `zzznomatch`, then asserts the URL gains the encoded `filter=(summary ~ 'zzznomatch*' OR description ~ 'zzznomatch*')` parameter, all three `.jira-col__count span` badges show `'0'`, the `h2` "No search results" heading and its subtitle are visible, the "Clear filters" button is visible, and the status region reads "Showing filtered work items"; after clicking "Clear filters" it asserts the URL reverts to `filter=&groupBy=status`, the To Do count returns to `'1'`, and the empty-state heading is gone.

## Runner

- exit code: 1
- assertions counted: 13
- passed: false
