# Feature toolbar.groupby.options — mutation attempt 01
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/toolbar.groupby.options.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "toolbar.groupby.options",
  "feature": "Group by options",
  "how_to_verify": "Click Group by. Popover shows 4 radios.",
  "expect_radios": [
    "Assignee",
    "Category",
    "Priority",
    "Status"
  ],
  "default_checked": "Status",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "toolbar.groupby.options",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Toolbar button role=button has accessible name 'Group by Status' with visible text 'Group: Status'",
    "Clicking the 'Group by Status' button sets its aria-expanded to true and reveals a role=radiogroup with accessible name 'Group by field'",
    "The radiogroup contains exactly 4 radios in this order: 'Assignee', 'Category', 'Priority', 'Status Selected'",
    "radio 'Assignee' is present (not checked)",
    "radio 'Category' is present (not checked)",
    "radio 'Priority' is present (not checked)",
    "radio 'Status Selected' is the currently [checked] radio (default selection matches ?groupBy=status URL)",
    "The Status radio also contains an inline img with alt text 'Selected' indicating the selected state"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Group by toolbar trigger button",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      },
      {
        "purpose": "Group by popover radio group",
        "preferred": "getByRole('radiogroup', { name: 'Group by field' })",
        "fallback": "locator('[role=\"radiogroup\"]')"
      },
      {
        "purpose": "Assignee radio option",
        "preferred": "getByRole('radio', { name: 'Assignee' })",
        "fallback": "getByText('Assignee', { exact: true })"
      },
      {
        "purpose": "Category radio option",
        "preferred": "getByRole('radio', { name: 'Category' })",
        "fallback": "getByText('Category', { exact: true })"
      },
      {
        "purpose": "Priority radio option",
        "preferred": "getByRole('radio', { name: 'Priority' })",
        "fallback": "getByText('Priority', { exact: true })"
      },
      {
        "purpose": "Status radio option (default-checked)",
        "preferred": "getByRole('radio', { name: /^Status/ })",
        "fallback": "getByRole('radio', { name: 'Status Selected' })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.getByRole('button', { name: 'Group by Status' }).click();",
      "await expect(page.getByRole('radiogroup', { name: 'Group by field' })).toBeVisible();",
      "await expect(page.getByRole('radiogroup', { name: 'Group by field' }).getByRole('radio')).toHaveCount(4);",
      "await expect(page.getByRole('radio', { name: 'Assignee' })).toBeVisible();",
      "await expect(page.getByRole('radio', { name: 'Category' })).toBeVisible();",
      "await expect(page.getByRole('radio', { name: 'Priority' })).toBeVisible();",
      "await expect(page.getByRole('radio', { name: /^Status/ })).toBeChecked();"
    ],
    "mutation_and_revert": null
  },
  "notes": "The Status radio's accessible name is 'Status Selected' (includes the 'Selected' img alt). Use a regex like /^Status/ or the exact 'Status Selected' name when targeting it. The radiogroup has accessible name 'Group by field'. Popover opens inline (button aria-expanded toggles to true); no extra dialog role. Two unrelated console errors/6 warnings were present on load but did not affect interactions.",
  "turns": 5,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/toolbar.groupby.options.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
The Group by radiogroup feature (4 radios including "Category", `role="radiogroup"` with accessible name "Group by field", `aria-expanded` button, "Group by Status" accessible name) is **not implemented in `src/`** at all. The local app's Group by button at line 1321 of `src/App.tsx` uses a plain `role="menu"` popover with three `role="menuitem"` `MenuButton` components (Status, Priority, Assignee — no Category), has `aria-label="Group by"` (not "Group by Status"), and has no `aria-expanded` attribute. The spec navigates to `https://fleet-team-y0ak1u2s.atlassian.net` (the real Jira Cloud), and every detail it asserts — the radiogroup, the four radios, the checked state — lives entirely in that external service. No edit to `src/` or `public/` can reach it. Making no edits.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified