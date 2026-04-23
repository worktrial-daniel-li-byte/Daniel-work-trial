# Feature card.priority_inline — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/card.priority_inline.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "card.priority_inline",
  "feature": "Priority icon opens inline priority picker",
  "how_to_verify": "Click the priority icon on the card. Popover lists 5 options, current selected is highlighted.",
  "expect_options": [
    "Highest",
    "High",
    "Medium",
    "Low",
    "Lowest"
  ],
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "card.priority_inline",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Card AUT-1 ('Design autonomous replanning loop') is visible in the To Do column",
    "Card AUT-1 has a button with accessible name 'Priority: High' (role=button, aria-expanded toggles on click) containing an img with name 'Priority: High'",
    "Clicking the 'Priority: High' button opens a dialog with accessible name 'Edit priority'",
    "Inside the dialog, a static text node shows the current selection 'High'",
    "Inside the dialog, a combobox 'Change priority' is present with aria-expanded=true",
    "The dialog contains a listbox with exactly 5 options: 'Highest', 'High', 'Medium', 'Low', 'Lowest' (in this order)",
    "The option 'High' has aria-selected=true (selected state) while the other four options do not",
    "Pressing Escape closes the 'Edit priority' dialog and the 'Priority: High' button returns to non-expanded state"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "AUT-1 card priority icon/button",
        "preferred": "getByRole('button', { name: 'Priority: High' })",
        "fallback": "locator('button[aria-label=\"Priority: High\"]')"
      },
      {
        "purpose": "Inline priority picker dialog",
        "preferred": "getByRole('dialog', { name: 'Edit priority' })",
        "fallback": "locator('[role=\"dialog\"]').filter({ hasText: 'High' })"
      },
      {
        "purpose": "Priority options listbox",
        "preferred": "getByRole('dialog', { name: 'Edit priority' }).getByRole('listbox')",
        "fallback": "locator('[role=\"listbox\"]')"
      },
      {
        "purpose": "Option: Highest",
        "preferred": "getByRole('option', { name: 'Highest' })",
        "fallback": "getByText('Highest', { exact: true })"
      },
      {
        "purpose": "Option: High (currently selected)",
        "preferred": "getByRole('option', { name: 'High', selected: true })",
        "fallback": "locator('[role=\"option\"][aria-selected=\"true\"]')"
      },
      {
        "purpose": "Option: Medium",
        "preferred": "getByRole('option', { name: 'Medium' })",
        "fallback": "getByText('Medium', { exact: true })"
      },
      {
        "purpose": "Option: Low",
        "preferred": "getByRole('option', { name: 'Low' })",
        "fallback": "getByText('Low', { exact: true })"
      },
      {
        "purpose": "Option: Lowest",
        "preferred": "getByRole('option', { name: 'Lowest' })",
        "fallback": "getByText('Lowest', { exact: true })"
      },
      {
        "purpose": "Change priority combobox inside the dialog",
        "preferred": "getByRole('combobox', { name: 'Change priority' })",
        "fallback": "locator('[role=\"combobox\"][aria-expanded=\"true\"]')"
      },
      {
        "purpose": "To Do column heading (context for locating card)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.getByRole('button', { name: 'Priority: High' }).click()",
      "await expect(page.getByRole('dialog', { name: 'Edit priority' })).toBeVisible()",
      "await expect(page.getByRole('option')).toHaveText(['Highest', 'High', 'Medium', 'Low', 'Lowest'])",
      "await expect(page.getByRole('option', { name: 'High' })).toHaveAttribute('aria-selected', 'true')",
      "await page.keyboard.press('Escape')"
    ],
    "mutation_and_revert": null
  },
  "notes": "Feature is read-only verification (no mutation needed); after clicking the priority icon, the popover renders as role=dialog name='Edit priority' containing a role=listbox with 5 role=option children in the exact expected order, with 'High' marked aria-selected=true matching the card's current priority. Escape reliably dismisses the popover. Only AUT-1 exists on the board at verification time.",
  "turns": 6,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/card.priority_inline.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The file `tests/board/card.priority_inline.spec.mjs` has been written with 11 `expect()` calls covering: the board's "To Do" heading being visible, the `Priority: High` button's initial collapsed state, the `Edit priority` dialog appearing on click, the listbox containing exactly the 5 options (`Highest`, `High`, `Medium`, `Low`, `Lowest`) in order with `High` carrying `aria-selected="true"` and the others `"false"`, the `Change priority` combobox being present, and finally that pressing Escape dismisses the dialog and returns the button to `aria-expanded="false"`.

## Runner

- exit code: 1
- assertions counted: 13
- passed: false
