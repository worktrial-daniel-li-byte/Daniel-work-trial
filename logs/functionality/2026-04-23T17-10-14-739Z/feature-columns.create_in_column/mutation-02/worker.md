# Feature columns.create_in_column — mutation attempt 02
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/columns.create_in_column.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "columns.create_in_column",
  "feature": "Each column has a '+ Create' button at the bottom that opens an inline create form",
  "how_to_verify": "Click 'Create' in a column. An inline form appears in that column with a textarea placeholder 'What needs to be done?', a type selector, a date picker, an assignee selector, and a submit (Enter) affordance. Escape dismisses it without persisting.",
  "action_is_mutating": true,
  "notes": "Opened and cancelled in 'In Progress'; submission (which would persist) was intentionally skipped since the card cannot be removed from within the board (the card actions menu has no Delete).",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "columns.create_in_column",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Three column headings visible: role=heading level=3 name='To Do' (count '1'), 'In Progress' (count '0'), 'Done' (count '0')",
    "Each of the 'In Progress' and 'Done' columns has a trailing role=button name='Create' at the bottom of the column (refs e443 and e463 before click)",
    "Clicking 'Create' in the 'In Progress' column replaces that button with an inline create form within the same column region",
    "The inline form exposes role=textbox name='What needs to be done?' with active focus",
    "Status text inside the form reads: 'Task selected. Add your summary and then press Enter to submit. Use the Escape key to cancel.'",
    "The form contains a type selector button with accessible name 'Select work type. Task currently selected.'",
    "The form contains a date picker button with accessible name 'Due date'",
    "The form contains an assignee selector button with accessible name 'Assignee: Unassigned'",
    "The form contains a submit affordance: role=button name='⏎ Create' that is initially disabled (aria-disabled / disabled) when the textbox is empty",
    "Pressing Escape while the form is open dismisses it: the textbox disappears and the 'Create' button returns at the bottom of the 'In Progress' column",
    "After Escape, the 'In Progress' column count remains '0' confirming no work item was persisted",
    "The 'To Do' column is in collapsed state (only an 'Expand To Do' button is shown) and therefore does not expose a per-column 'Create' button in this view"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "In Progress column region (scope subsequent queries)",
        "preferred": "page.locator('div').filter({ has: page.getByRole('heading', { level: 3, name: 'In Progress' }) }).first()",
        "fallback": "page.getByRole('heading', { level: 3, name: 'In Progress' }).locator('xpath=ancestor::*[.//button[normalize-space(.)=\"Create\"]][1]')"
      },
      {
        "purpose": "In Progress column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'In Progress' })",
        "fallback": "getByText('In Progress', { exact: true })"
      },
      {
        "purpose": "'+ Create' button at bottom of In Progress column",
        "preferred": "inProgressColumn.getByRole('button', { name: 'Create', exact: true })",
        "fallback": "page.getByRole('button', { name: 'Create', exact: true }).nth(1)"
      },
      {
        "purpose": "Inline create textarea/textbox",
        "preferred": "getByRole('textbox', { name: 'What needs to be done?' })",
        "fallback": "getByPlaceholder('What needs to be done?')"
      },
      {
        "purpose": "Work type selector inside inline form",
        "preferred": "getByRole('button', { name: /Select work type\\. Task currently selected\\./ })",
        "fallback": "getByRole('button', { name: /work type/i })"
      },
      {
        "purpose": "Due date selector inside inline form",
        "preferred": "getByRole('button', { name: 'Due date' })",
        "fallback": "locator('button[aria-label=\"Due date\"]')"
      },
      {
        "purpose": "Assignee selector inside inline form",
        "preferred": "getByRole('button', { name: 'Assignee: Unassigned' })",
        "fallback": "getByRole('button', { name: /Assignee/ })"
      },
      {
        "purpose": "Submit button (Enter affordance) inside inline form",
        "preferred": "getByRole('button', { name: '⏎ Create' })",
        "fallback": "getByRole('button', { name: /Create/ }).and(page.locator('[disabled]'))"
      },
      {
        "purpose": "Instructional status text inside form",
        "preferred": "getByText('Task selected. Add your summary and then press Enter to submit. Use the Escape key to cancel.')",
        "fallback": "getByText(/press Enter to submit/)"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "const inProgressHeading = page.getByRole('heading', { level: 3, name: 'In Progress' })",
      "await expect(inProgressHeading).toBeVisible()",
      "const inProgressColumn = page.locator('div').filter({ has: inProgressHeading }).first()",
      "await inProgressColumn.getByRole('button', { name: 'Create', exact: true }).click()",
      "await expect(page.getByRole('textbox', { name: 'What needs to be done?' })).toBeFocused()",
      "await expect(page.getByRole('button', { name: /Select work type\\. Task currently selected\\./ })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Due date' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Assignee: Unassigned' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: '⏎ Create' })).toBeDisabled()",
      "await page.keyboard.press('Escape')",
      "await expect(page.getByRole('textbox', { name: 'What needs to be done?' })).toHaveCount(0)",
      "await expect(inProgressColumn.getByRole('button', { name: 'Create', exact: true })).toBeVisible()"
    ],
    "mutation_and_revert": {
      "mutate": [
        "Click the 'Create' button at the bottom of the 'In Progress' column to open the inline create form"
      ],
      "verify_post": [
        "The textbox with placeholder 'What needs to be done?' is present and focused",
        "Work type, Due date, and Assignee selectors are visible inside the form",
        "The '⏎ Create' submit button is disabled while the textbox is empty"
      ],
      "revert": [
        "Press Escape to dismiss the inline create form"
      ],
      "verify_revert": [
        "The 'What needs to be done?' textbox is no longer in the DOM",
        "The 'Create' button reappears at the bottom of the In Progress column",
        "The In Progress column count remains '0' (no work item persisted)"
      ]
    }
  },
  "notes": "Verification was intentionally restricted to open+escape on the 'In Progress' column (count stayed 0). Submission was not performed because a created card would be hard to clean up. The 'To Do' column was in a collapsed state during this session (only 'Expand To Do' button was exposed), so its per-column Create button was not directly observed; the identical Create button pattern is however present on 'In Progress' and 'Done'. The submit button's accessible name includes a leading enter glyph '⏎'.",
  "turns": 7,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/columns.create_in_column.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
Based on my thorough investigation of the source code, the inline create form feature described in this spec — with a `role=textbox name='What needs to be done?'`, status text "press Enter to submit", work-type selector button, due-date button, assignee-selector button, and `⏎ Create` submit button — **does not exist anywhere in `src/`**.

What `src/App.tsx` actually has is:
1. A per-column `<button aria-label="Create issue">` (accessible name = "Create issue", raw text = "+ Create"), and
2. A **modal dialog** (`ComposerDialog`) with an `<input placeholder="What needs to get done?">` — a completely different UI from what the spec asserts.

None of the expected accessible names or instructional text (`"What needs to be done?"`, `"⏎ Create"`, `"Select work type. Task currently selected."`, `"Assignee: Unassigned"`, `"press Enter to submit"`) appear anywhere in `src/` or `public/`. The spec's browser evidence was captured against the live Atlassian tenant (`fleet-team-y0ak1u2s.atlassian.net`), where the real Jira SPA implements the inline create form. The local SPA clone never implemented this feature.

**No edits made.** The feature lives entirely behind the external Jira URL, not in `src/` or `public/`.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified