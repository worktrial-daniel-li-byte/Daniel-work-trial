# Feature toolbar.filter.button — mutation attempt 02
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/toolbar.filter.button.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "toolbar.filter.button",
  "feature": "Filter button shows active count",
  "how_to_verify": "Snapshot: role=button name matches /^\\d+ filters applied$/. Default is '0 filters applied'.",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
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

Spec file (read-only — do NOT edit it): tests/board/toolbar.filter.button.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
The spec navigates directly to the live Atlassian URL (`https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board`). The filter button with `aria-label="0 filters applied"` and `data-testid="business-filters.ui.filters.trigger.button-wrapper"` is rendered by Atlassian's servers, not by the local `src/` code. Although `src/App.tsx` contains a local replica of that button (around line 1226), the spec fixture's `JIRA_BASE` defaults to the external URL and is not redirected to localhost by any env var in `.env` or the harness runner — edits to `src/` cannot influence what the test observes. This feature is not load-bearing in `src/`; making no edits.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified