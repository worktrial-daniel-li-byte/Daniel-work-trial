# Feature columns.collapse — mutation attempt 02
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/columns.collapse.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "columns.collapse",
  "feature": "Each column has a collapse toggle",
  "how_to_verify": "Snapshot: role=button name='Collapse {Status}' per column.",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "columns.collapse",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "role=heading level=3 name='To Do' is visible on the board",
    "role=heading level=3 name='In Progress' is visible on the board",
    "role=heading level=3 name='Done' is visible on the board",
    "role=button name='Collapse To Do' exists next to the 'To Do' heading",
    "role=button name='Collapse In Progress' exists next to the 'In Progress' heading",
    "role=button name='Collapse Done' exists next to the 'Done' heading",
    "After clicking 'Collapse To Do', the button's accessible name changes to 'Expand To Do' and the column is rendered in a collapsed state (heading 'To Do' still present, card list hidden)",
    "Clicking 'Expand To Do' reverts the column: all three buttons are again 'Collapse To Do', 'Collapse In Progress', 'Collapse Done'",
    "Other sibling button present per column: 'More actions for column {Status}'"
  ],
  "playwright_hints": {
    "locators": [
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
        "purpose": "Collapse toggle for To Do column",
        "preferred": "getByRole('button', { name: 'Collapse To Do' })",
        "fallback": "locator('button[aria-label=\"Collapse To Do\"]')"
      },
      {
        "purpose": "Collapse toggle for In Progress column",
        "preferred": "getByRole('button', { name: 'Collapse In Progress' })",
        "fallback": "locator('button[aria-label=\"Collapse In Progress\"]')"
      },
      {
        "purpose": "Collapse toggle for Done column",
        "preferred": "getByRole('button', { name: 'Collapse Done' })",
        "fallback": "locator('button[aria-label=\"Collapse Done\"]')"
      },
      {
        "purpose": "Expand toggle shown after To Do column is collapsed",
        "preferred": "getByRole('button', { name: 'Expand To Do' })",
        "fallback": "locator('button[aria-label=\"Expand To Do\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Collapse In Progress' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Collapse Done' })).toBeVisible()"
    ],
    "mutation_and_revert": {
      "mutate": [
        "await page.getByRole('button', { name: 'Collapse To Do' }).click()"
      ],
      "verify_post": [
        "await expect(page.getByRole('button', { name: 'Expand To Do' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Collapse To Do' })).toHaveCount(0)"
      ],
      "revert": [
        "await page.getByRole('button', { name: 'Expand To Do' }).click()"
      ],
      "verify_revert": [
        "await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Expand To Do' })).toHaveCount(0)"
      ]
    }
  },
  "notes": "Each column header contains a 'Collapse {Status}' button alongside a 'More actions for column {Status}' button and an 'Edit {Status} status column, edit' button. When a column is collapsed, its heading (role=heading, level=3) remains present but the card list is hidden and the collapse button toggles to 'Expand {Status}'. Observed column names: 'To Do' (count 1), 'In Progress' (count 0), 'Done' (count 0). A persistent sidebar button 'Collapse sidebar' also exists and must not be confused with column collapse buttons; always scope column-collapse locators by the per-status accessible name.",
  "turns": 10,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/columns.collapse.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
After thoroughly searching through all of `src/App.tsx`, `src/App.css`, `src/designSystem.tsx`, and `src/state/boardState.ts`, I can confirm:

**The column collapse toggle feature is NOT implemented in `src/`.** The only trace in the source is a non-interactive `<span className="sr-only">Collapse {group.title}</span>` at line 2627 of `App.tsx` — this is a plain `<span>`, not a `<button>`, and there is zero collapse state management (`isCollapsed`, `useState` for collapsed columns, etc.) anywhere in the codebase.

The `BoardView` component has no `useState` hook at all, `BoardViewProps` has no collapse-related props, and there is no `aria-label` containing "Collapse" applied to any button element. The browser evidence URL (`fleet-team-y0ak1u2s.atlassian.net`) confirms the "pass" was observed against the live Jira tenant, not the local SPA.

**I am making NO edits.** The feature lives entirely behind the external Jira URL that the local clone never served — this test is not load-bearing against the local SPA.
- saboteur_skipped: true
- after-sabotage runner: exit=1 passed=false
- after-revert runner:   exit=1 passed=false
- load_bearing:          false
- failure_reason:        saboteur made no edits AND spec did not re-pass after no-op revert (exit=1)