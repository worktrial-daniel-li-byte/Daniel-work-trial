# Feature columns.add_column — attempt 02

## Task to worker

Your previous attempt at tests/board/columns.add_column.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Spec passed initially, but the mutation check FAILED — the test is
not load-bearing. Rewrite the spec with stricter assertions that
target the specific DOM surfaces the feature produces (role+name,
exact visible text, exact URL fragment, computed attributes).

Diagnostic: spec STAYED GREEN after feature was removed — the test is not load-bearing. Tighten its assertions against the specific DOM the feature produces.

Saboteur summary: I edited `src/App.tsx` to rename the button's accessible label from `"Create status"` to `"Add column"`, so `getByRole('button', { name: 'Create status' })` will no longer match the `+` button at the end of the columns row, causing the spec's first assertion (`await expect(createStatusBtn).toBeVisible()`) to fail.

----- RUNNER (post-sabotage) -----
exitCode=0 passed=true

Running 1 test using 1 worker

  ✓  1 tests/board/columns.add_column.spec.mjs:4:3 › columns.add_column — '+' button at the end of the columns row to add a new column/status › Create status button opens modal; Cancel reverts board to original 3-column state (3.2s)

  1 passed (3.5s)


----- RUNNER (post-revert) -----
exitCode=0 passed=true

Running 1 test using 1 worker

  ✓  1 tests/board/columns.add_column.spec.mjs:4:3 › columns.add_column — '+' button at the end of the columns row to add a new column/status › Create status button opens modal; Cancel reverts board to original 3-column state (3.0s)

  1 passed (3.3s)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "columns.add_column",
  "feature": "'+' button at the end of the columns row to add a new column/status",
  "how_to_verify": "Snapshot: rightmost unnamed role=button after the 'Done' column's Create.",
  "action_is_mutating": true,
  "status": "pass_presence_only"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "columns.add_column",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "page title is 'Board - Autoloop - Jira'",
    "heading level=2 name='Board' is visible in the Space navigation",
    "Three status column headings level=3 are visible: 'To Do', 'In Progress', 'Done'",
    "Each non-collapsed column has a button 'Create' (the per-column add work item button), e.g. ref e443 under In Progress and e463 under Done",
    "At the rightmost end of the columns row, after the 'Done' column's Create button, there is a button with accessible name 'Create status' containing an img child with alt='Create status' (ref e466)",
    "Clicking 'Create status' opens a role=dialog with accessible name 'Create status' containing heading level=1 'Create status'",
    "The dialog contains a form with accessible name 'Status form', a required textbox 'Name' (initially focused), a 'Status category' combobox defaulting to 'To do', a 'Cancel' button and a disabled 'Submit' button",
    "Clicking the 'Cancel' button dismisses the dialog and leaves the board in its original 3-column state (To Do / In Progress / Done)"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "The '+' button at end of columns row to add a new column/status",
        "preferred": "getByRole('button', { name: 'Create status' })",
        "fallback": "locator('button:has(img[alt=\"Create status\"])')"
      },
      {
        "purpose": "Done column heading (anchor for 'end of row' positioning)",
        "preferred": "getByRole('heading', { level: 3, name: 'Done' })",
        "fallback": "getByText('Done', { exact: true })"
      },
      {
        "purpose": "Create status modal dialog opened by the + button",
        "preferred": "getByRole('dialog', { name: 'Create status' })",
        "fallback": "locator('[role=\"dialog\"]')"
      },
      {
        "purpose": "Modal heading",
        "preferred": "getByRole('heading', { level: 1, name: 'Create status' })",
        "fallback": "getByText('Create status', { exact: true })"
      },
      {
        "purpose": "Name input inside the Create status dialog",
        "preferred": "getByRole('textbox', { name: 'Name' })",
        "fallback": "locator('form[aria-label=\"Status form\"] input')"
      },
      {
        "purpose": "Submit button (disabled until name filled)",
        "preferred": "getByRole('button', { name: 'Submit' })",
        "fallback": "locator('button:has-text(\"Submit\")')"
      },
      {
        "purpose": "Cancel button to close the dialog and revert",
        "preferred": "getByRole('button', { name: 'Cancel' })",
        "fallback": "locator('[role=\"dialog\"] button:has-text(\"Cancel\")')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('heading', { level: 3, name: 'Done' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Create status' })).toBeVisible()"
    ],
    "mutation_and_revert": {
      "mutate": [
        "await page.getByRole('button', { name: 'Create status' }).click()"
      ],
      "verify_post": [
        "await expect(page.getByRole('dialog', { name: 'Create status' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 1, name: 'Create status' })).toBeVisible()",
        "await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled()"
      ],
      "revert": [
        "await page.getByRole('button', { name: 'Cancel' }).click()"
      ],
      "verify_revert": [
        "await expect(page.getByRole('dialog', { name: 'Create status' })).toBeHidden()",
        "await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'In Progress' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'Done' })).toBeVisible()"
      ]
    }
  },
  "notes": "The '+' at the end of the columns row is an icon-only button with accessible name 'Create status' (img alt='Create status'). It does not immediately create a column; it opens a modal. Presence-only check is satisfied by clicking and observing the dialog, then cancelling to avoid any persisted mutation. The two per-column 'Create' buttons (inside In Progress / Done) are NOT the same as the end-of-row 'Create status' button and must be disambiguated using 'Create status' vs 'Create'.",
  "turns": 6,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/columns.add_column.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I rewrote `tests/board/columns.add_column.spec.mjs` with two interlocking load-bearing assertions that catch either mutation path the saboteur used: `toHaveCount(1)` + `toBeVisible()` on `page.locator('button:has(img[alt="Create status"])')` (fails if the img alt is renamed) and `toHaveAccessibleName('Create status')` on the same element (fails if an `aria-label` override changes the computed accessible name to anything else, such as `"Add column"`).

## Runner

- exit code: 1
- assertions counted: 16
- passed: false
