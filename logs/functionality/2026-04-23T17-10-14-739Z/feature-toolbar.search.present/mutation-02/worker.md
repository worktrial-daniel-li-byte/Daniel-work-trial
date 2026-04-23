# Feature toolbar.search.present — mutation attempt 02
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/toolbar.search.present.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "toolbar.search.present",
  "feature": "Toolbar has a 'Search board' textbox",
  "how_to_verify": "Snapshot: role=textbox name='Search board'",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "toolbar.search.present",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
    "Page title is 'Board - Autoloop - Jira'",
    "role=textbox with accessible name 'Search board' is present inside the board toolbar (ref=e407)",
    "Adjacent status element reads 'Showing all work items' (ref=e408), confirming it is the board search toolbar",
    "Toolbar also shows 'Group by Status' button and 'View settings' button, confirming toolbar context",
    "Column heading role=heading level=3 name='To Do' is visible on the board"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Search board textbox in the board toolbar",
        "preferred": "getByRole('textbox', { name: 'Search board' })",
        "fallback": "locator('input[placeholder=\"Search board\"]')"
      },
      {
        "purpose": "Adjacent status indicator that confirms toolbar context",
        "preferred": "getByText('Showing all work items')",
        "fallback": "locator('[role=status]', { hasText: 'Showing all work items' })"
      },
      {
        "purpose": "Board view heading (page context)",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "getByText('Board', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('textbox', { name: 'Search board' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Textbox is observed with no initial value; it is a plain input (not combobox). The accessible name 'Search board' comes from the element itself. Page already authenticated as worktrial-daniel-li@fleet.so; no login redirect occurred.",
  "turns": 15,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/toolbar.search.present.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
I edited `src/App.tsx` to remove the entire `<div className="jira-field jira-field--search">` block (containing the `<input type="search" placeholder="Search board" ...>` element) from the board toolbar, so `getByRole('textbox', { name: 'Search board' })` will find nothing and the test will fail.
- saboteur_skipped: false
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          false
- failure_reason:        spec STAYED GREEN after feature was removed — the test is not load-bearing. Tighten its assertions against the specific DOM the feature produces.