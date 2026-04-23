# Feature columns.default_set — mutation attempt 02
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/columns.default_set.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
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

BROWSER EVIDENCE (what the spec is expected to observe):
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

Spec file (read-only — do NOT edit it): tests/board/columns.default_set.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
I changed `aria-level={3}` to `aria-level={2}` on the column header heading element in `src/App.tsx`. The test looks for `getByRole('heading', { level: 3, name: 'To Do' })` (and similarly for "In Progress" and "Done"), which will now fail because the headings are level 2 instead of level 3.
- saboteur_skipped: false
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          false
- failure_reason:        spec STAYED GREEN after feature was removed — the test is not load-bearing. Tighten its assertions against the specific DOM the feature produces.