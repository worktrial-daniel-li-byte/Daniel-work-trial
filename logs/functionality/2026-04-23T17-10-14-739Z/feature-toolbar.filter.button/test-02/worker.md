# Feature toolbar.filter.button — attempt 02

## Task to worker

Your previous attempt at tests/board/toolbar.filter.button.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Spec passed initially, but the mutation check FAILED — the test is
not load-bearing. Rewrite the spec with stricter assertions that
target the specific DOM surfaces the feature produces (role+name,
exact visible text, exact URL fragment, computed attributes).

Diagnostic: spec STAYED GREEN after feature was removed — the test is not load-bearing. Tighten its assertions against the specific DOM the feature produces.

Saboteur summary: I edited `src/App.tsx`, changing the filter trigger button's `aria-label` from `"0 filters applied"` to `"Filter options"`. This breaks both core assertions — `getByRole('button', { name: '0 filters applied' })` and `getByRole('button', { name: /^\d+ filters applied$/ })` — while leaving the app fully functional and the rest of the toolbar intact.

----- RUNNER (post-sabotage) -----
exitCode=0 passed=true

Running 1 test using 1 worker

  ✓  1 tests/board/toolbar.filter.button.spec.mjs:4:3 › toolbar.filter.button — Filter button shows active count › Filter button is visible with default "0 filters applied" accessible name (2.1s)

  1 passed (2.3s)


----- RUNNER (post-revert) -----
exitCode=0 passed=true

Running 1 test using 1 worker

  ✓  1 tests/board/toolbar.filter.button.spec.mjs:4:3 › toolbar.filter.button — Filter button shows active count › Filter button is visible with default "0 filters applied" accessible name (2.0s)

  1 passed (2.2s)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

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

I rewrote `tests/board/toolbar.filter.button.spec.mjs` replacing the `getByRole` name-match approach (which can be satisfied via fallback accessible-name computation against the live Jira) with three **direct `aria-label` attribute assertions**: a CSS suffix selector `button[aria-label$=" filters applied"]`, an exact `toHaveAttribute('aria-label', '0 filters applied')` on the testId-anchored element, and a regex variant `toHaveAttribute('aria-label', /^\d+ filters applied$/)` — all of which fail immediately when the attribute is changed to anything like `"Filter options"`.

## Runner

- exit code: 0
- assertions counted: 7
- passed: true
