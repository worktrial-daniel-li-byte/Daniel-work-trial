# Feature toolbar.save_or_reset — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.save_or_reset.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.save_or_reset",
  "feature": "'Save or reset view settings' button appears when current view differs from saved",
  "how_to_verify": "Change Group by (e.g. Status → Priority) or apply a search/filter; a new button role=button name='Save or reset view settings' appears between 'View settings' and 'More actions'.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.save_or_reset",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "Initial page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status' and the toolbar shows role=button name='Group by Status' followed by 'View settings' then 'More actions' with NO 'Save or reset view settings' button present",
    "Clicking the 'Group by Status' button opens a radiogroup with name='Group by field' containing radios: 'Assignee', 'Category', 'Priority', and 'Status Selected' (aria-checked=true)",
    "Clicking radio name='Priority' changes page.url() to 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=priority' and the board columns re-render as headings level=3: 'Highest', 'High', 'Medium', 'Low', 'Lowest'",
    "After switching groupBy to priority, the toolbar now shows role=button name='Save or reset view settings' located between role=button name='View settings' and role=button name='More actions'",
    "The 'Group by' toolbar button relabels to role=button name='Group by Priority' with inner text 'Group: Priority' after the change",
    "Clicking the Status radio again returns URL to groupBy=status and aria-checked on Priority radio becomes false while Status becomes true",
    "After reverting to groupBy=status, a DOM scan for any button whose text/aria-label contains 'Save or reset view settings' returns {found: false} — the button is removed from the DOM"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Group by toolbar button (initial state when grouped by Status)",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      },
      {
        "purpose": "Group by toolbar button after switching to Priority",
        "preferred": "getByRole('button', { name: 'Group by Priority' })",
        "fallback": "getByText('Group: Priority')"
      },
      {
        "purpose": "Priority radio in the Group by popover",
        "preferred": "getByRole('radio', { name: 'Priority' })",
        "fallback": "getByRole('radiogroup', { name: 'Group by field' }).getByText('Priority')"
      },
      {
        "purpose": "Status radio in the Group by popover (for reverting)",
        "preferred": "getByRole('radio', { name: /^Status/ })",
        "fallback": "getByRole('radiogroup', { name: 'Group by field' }).getByText('Status', { exact: true })"
      },
      {
        "purpose": "View settings toolbar button (always present)",
        "preferred": "getByRole('button', { name: 'View settings' })",
        "fallback": "locator('button:has-text(\"View settings\")')"
      },
      {
        "purpose": "The Save or reset view settings button under test",
        "preferred": "getByRole('button', { name: 'Save or reset view settings' })",
        "fallback": "locator('button[aria-label=\"Save or reset view settings\"]')"
      },
      {
        "purpose": "More actions toolbar button (always present, used to anchor position)",
        "preferred": "getByRole('button', { name: 'More actions' }).last()",
        "fallback": "locator('button:has-text(\"More actions\")').last()"
      }
    ],
    "url_assertions": [
      "/projects/AUT/board?filter=&groupBy=status",
      "/projects/AUT/board?filter=&groupBy=priority"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('button', { name: 'Save or reset view settings' })).toHaveCount(0)",
      "await page.getByRole('button', { name: 'Group by Status' }).click()",
      "await page.getByRole('radio', { name: 'Priority' }).click()",
      "await expect(page).toHaveURL(/groupBy=priority/)",
      "await expect(page.getByRole('button', { name: 'Save or reset view settings' })).toBeVisible()",
      "await page.getByRole('button', { name: 'Group by Priority' }).click()",
      "await page.getByRole('radio', { name: /^Status/ }).click()",
      "await expect(page).toHaveURL(/groupBy=status/)",
      "await expect(page.getByRole('button', { name: 'Save or reset view settings' })).toHaveCount(0)"
    ],
    "mutation_and_revert": {
      "mutate": [
        "Click getByRole('button', { name: 'Group by Status' })",
        "Click getByRole('radio', { name: 'Priority' })"
      ],
      "verify_post": [
        "page URL matches /groupBy=priority/",
        "getByRole('button', { name: 'Save or reset view settings' }) is visible",
        "toolbar order: View settings -> Save or reset view settings -> More actions"
      ],
      "revert": [
        "Click getByRole('button', { name: 'Group by Priority' })",
        "Click getByRole('radio', { name: /^Status/ })"
      ],
      "verify_revert": [
        "page URL matches /groupBy=status/",
        "getByRole('button', { name: 'Save or reset view settings' }) has count 0 (removed from DOM)"
      ]
    }
  },
  "notes": "The Status radio in the popover exposes its accessible name as 'Status Selected' when it is the currently-checked option (a visible 'Selected' icon is part of the name), so use a regex like /^Status/ to match it reliably in both states. The 'Save or reset view settings' button is entirely removed from the DOM (not merely hidden) when the current view matches the saved view — assertions should use toHaveCount(0) rather than not.toBeVisible(). The Group by toolbar button's accessible name updates dynamically ('Group by Status' vs 'Group by Priority'). No spotlight/onboarding overlays appeared during this session.",
  "turns": 11,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.save_or_reset.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The file `tests/board/toolbar.save_or_reset.spec.mjs` is written. It implements the full mutate→verify→revert→verify sequence: asserting the "Save or reset view settings" button has `count(0)` on initial load (grouped by Status), then clicking through the Group by popover to select Priority and asserting the button becomes visible (plus URL changes to `groupBy=priority` and board headings like "Medium" appear), and finally reverting back to Status grouping and asserting the button is fully removed from the DOM again (`toHaveCount(0)`).

## Runner

- exit code: 1
- assertions counted: 16
- passed: false
