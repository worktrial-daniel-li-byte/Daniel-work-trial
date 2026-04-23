# Feature toolbar.groupby.button — mutation attempt 01
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/toolbar.groupby.button.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "toolbar.groupby.button",
  "feature": "Group by button reflects current grouping",
  "how_to_verify": "Snapshot: role=button name='Group by {Field}'. Default name='Group by Status'.",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
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

Spec file (read-only — do NOT edit it): tests/board/toolbar.groupby.button.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
After thorough examination of the codebase, I've determined the following:

1. **The test's `JIRA_BASE`** defaults to `https://fleet-team-y0ak1u2s.atlassian.net` (from `tests/_fixtures/jira.mjs`), and `JIRA_BASE_URL` is not set anywhere in `.env` or the test-runner config.

2. **The local `src/App.tsx`** has `aria-label="Group by"` (a static string) on the Group-by button — it does **not** reflect the current grouping (e.g., "Group by Status"). The button also lacks `aria-haspopup="true"` and `aria-expanded="false"`. So `getByRole('button', { name: 'Group by Status' })` cannot match the local app.

3. The `mcp/test-loop` code confirms mutation checks are "only meaningful when specs target a local clone you control", and there is no mechanism to redirect `JIRA_BASE_URL` to localhost in the test runner.

**Conclusion:** The "Group by button reflects current grouping" feature (dynamic `aria-label="Group by {Field}"`, `aria-haspopup`, `aria-expanded`) lives entirely on the live Atlassian Jira instance, not in `src/`. The local clone's button has only a static label and the relevant ARIA attributes are absent. Modifying `src/` cannot cause the spec to fail because the spec navigates to and asserts against the external Atlassian URL. I am making **no edits**.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified