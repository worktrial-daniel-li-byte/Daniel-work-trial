# Feature page.load — mutation attempt 01
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/page.load.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "page.load",
  "feature": "Route renders board with Status columns when /board?groupBy=status",
  "how_to_verify": "Navigate to /jira/core/projects/{key}/board?filter=&groupBy=status",
  "expect": "Page title ends with 'Board - {Space} - Jira'. Level-3 headings 'To Do', 'In Progress', 'Done' are present.",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "page.load",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "document.title === 'Board - Autoloop - Jira' (ends with 'Board - Autoloop - Jira')",
    "role=heading level=3 name=\"To Do\" is visible (column header with count '1')",
    "role=heading level=3 name=\"In Progress\" is visible (column header with count '0')",
    "role=heading level=3 name=\"Done\" is visible (column header with count '0')",
    "role=heading level=1 name=\"Autoloop\" is visible as the space title",
    "role=heading level=2 name=\"Board\" is visible in the space navigation tabs",
    "Button 'Group by Status' is present with visible text 'Group: Status'"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "To Do status column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      },
      {
        "purpose": "In Progress status column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "getByText('In Progress', { exact: true })"
      },
      {
        "purpose": "Done status column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Done' })",
        "fallback": "getByText('Done', { exact: true })"
      },
      {
        "purpose": "Space (project) title",
        "preferred": "getByRole('heading', { level: 1, name: 'Autoloop' })",
        "fallback": "getByText('Autoloop', { exact: true })"
      },
      {
        "purpose": "Active Board tab in space navigation",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "getByText('Board', { exact: true })"
      },
      {
        "purpose": "Group-by control indicating Status grouping",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page).toHaveTitle(/Board - Autoloop - Jira$/)"
    ],
    "mutation_and_revert": null
  },
  "notes": "Page loaded fully authenticated (no login redirect). Status columns are rendered as role=heading level=3 with exact names 'To Do', 'In Progress', 'Done'. Column counts (1/0/0) are sibling generic elements, not part of the heading accessible name. Two console errors and five warnings were observed but none blocked rendering.",
  "turns": 3,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/page.load.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
The test in `tests/board/page.load.spec.mjs` navigates directly to `https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status` — a live, external Atlassian Jira instance. The fixture (`tests/_fixtures/jira.mjs`) defaults `JIRA_BASE` to that remote URL with no local override, and the test runner (`mcp/test-loop/verifier.mjs`) never injects `JIRA_BASE_URL` to redirect to a local server. There is no proxy in `vite.config.ts` either.

The "To Do / In Progress / Done" h3 column headings are rendered by the real Atlassian Jira service, not by anything in `src/` or `public/`. No edit to the local source tree can make this spec fail. I am making **no edits**.
- saboteur_skipped: true
- after-sabotage runner: exit=1 passed=false
- after-revert runner:   exit=1 passed=false
- load_bearing:          false
- failure_reason:        saboteur made no edits AND spec did not re-pass after no-op revert (exit=1)