# Feature toolbar.groupby.mutates_columns — implementation attempt 01

## Task to implementation worker

The browser agent verified this feature against the running app and reports it as broken or incomplete. Implement it.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.groupby.mutates_columns",
  "feature": "Selecting a different Group by value swaps columns and updates the URL",
  "how_to_verify": "Open Group by → click 'Priority'. Toolbar button renames to 'Group by Priority'; URL query changes groupBy=status → groupBy=priority; column headings switch to ['Highest','High','Medium','Low','Lowest']; AUT-1 (priority=Medium) appears under Medium; card-actions button aria-name becomes 'Card actions on Task AUT-1 of the Medium column'. A new 'Save or reset view settings' button appears to the left of 'More actions'.",
  "reverted_by": "Open Group by → click 'Status'. Columns, URL, and card column reset to the original Status grouping.",
  "action_is_mutating": true,
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (latest, ground truth for the current DOM):
```json
{
  "id": "toolbar.groupby.mutates_columns",
  "status": "PARTIAL",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "Initial page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Toolbar button has accessible name 'Group by Status' with inner text 'Group: Status'",
    "Initial column headings (role=heading level=3) are exactly: 'To Do', 'In Progress', 'Done'",
    "Under Status grouping, AUT-1 is in the 'To Do' column; its card-actions button aria-label is 'Card actions on Task AUT-1 of the To Do column'",
    "AUT-1 card shows a 'Priority: High' button (img/button aria-label 'Priority: High') — AUT-1 priority is High, NOT Medium as stated in the feature check",
    "Clicking 'Group by Status' opens a radiogroup with accessible name 'Group by field' containing radios: 'Assignee', 'Category', 'Priority', 'Status Selected' (Status aria-checked=true)",
    "Clicking the 'Priority' radio navigates page.url() to 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=priority'",
    "After switch, toolbar button accessible name becomes 'Group by Priority' with inner text 'Group: Priority'",
    "After switch, column headings (role=heading level=3) are exactly: 'Highest', 'High', 'Medium', 'Low', 'Lowest'",
    "Column counts after switch: Highest=0, High=1, Medium=0, Low=0, Lowest=0",
    "AUT-1 appears under the 'High' column (not 'Medium'); its card-actions button aria-label becomes 'Card actions on Task AUT-1 of the High column' (feature check claimed 'Medium column' — this is incorrect)",
    "A new button 'Save or reset view settings' appears in the toolbar, positioned between 'View settings' and 'More actions'",
    "Clicking 'Group by Priority' and selecting the 'Status' radio reverts URL to '...?filter=&groupBy=status'",
    "After revert, column headings return to 'To Do', 'In Progress', 'Done' and the 'Save or reset view settings' button is no longer in the DOM (queryByLabel returns null)",
    "After revert, toolbar button aria-label is again 'Group by Status' and AUT-1 is again in the To Do column"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Group by toolbar button (Status state)",
        "preferred": "getByRole('button', { name: 'Group by Status' })",
        "fallback": "getByText('Group: Status')"
      },
      {
        "purpose": "Group by toolbar button (Priority state)",
        "preferred": "getByRole('button', { name: 'Group by Priority' })",
        "fallback": "getByText('Group: Priority')"
      },
      {
        "purpose": "Group by menu radiogroup",
        "preferred": "getByRole('radiogroup', { name: 'Group by field' })",
        "fallback": "locator('[role=\"radiogroup\"]')"
      },
      {
        "purpose": "Priority radio option",
        "preferred": "getByRole('radio', { name: 'Priority' })",
        "fallback": "getByText('Priority', { exact: true })"
      },
      {
        "purpose": "Status radio option (selected state appends 'Selected')",
        "preferred": "getByRole('radio', { name: /^Status/ })",
        "fallback": "getByText('Status', { exact: true })"
      },
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
        "purpose": "Highest priority column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Highest' })",
        "fallback": "getByText('Highest', { exact: true })"
      },
      {
        "purpose": "High priority column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'High' })",
        "fallback": "getByText('High', { exact: true })"
      },
      {
        "purpose": "Medium priority column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Medium' })",
        "fallback": "getByText('Medium', { exact: true })"
      },
      {
        "purpose": "Low priority column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Low' })",
        "fallback": "getByText('Low', { exact: true })"
      },
      {
        "purpose": "Lowest priority column heading",
        "preferred": "getByRole('heading', { level: 3, name: 'Lowest' })",
        "fallback": "getByText('Lowest', { exact: true })"
      },
      {
        "purpose": "AUT-1 card actions under Status grouping",
        "preferred": "getByRole('button', { name: 'Card actions on Task AUT-1 of the To Do column' })",
        "fallback": "locator('[aria-label=\"Card actions on Task AUT-1 of the To Do column\"]')"
      },
      {
        "purpose": "AUT-1 card actions under Priority grouping (actual column is High, NOT Medium)",
        "preferred": "getByRole('button', { name: 'Card actions on Task AUT-1 of the High column' })",
        "fallback": "locator('[aria-label=\"Card actions on Task AUT-1 of the High column\"]')"
      },
      {
        "purpose": "Save or reset view settings button (only visible when view deviates from default)",
        "preferred": "getByRole('button', { name: 'Save or reset view settings' })",
        "fallback": "locator('button[aria-label=\"Save or reset view settings\"]')"
      },
      {
        "purpose": "More actions toolbar button",
        "preferred": "getByRole('button', { name: 'More actions', exact: true })",
        "fallback": "locator('button[aria-label=\"More actions\"]')"
      },
      {
        "purpose": "View settings toolbar button",
        "preferred": "getByRole('button', { name: 'View settings' })",
        "fallback": "locator('button[aria-label=\"View settings\"]')"
      }
    ],
    "url_assertions": [
      "groupBy=status",
      "groupBy=priority",
      "/jira/core/projects/AUT/board"
    ],
    "interactions": [
      "page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "page.getByRole('button', { name: 'Group by Status' }).click()",
      "page.getByRole('radio', { name: 'Priority' }).click()",
      "page.getByRole('button', { name: 'Group by Priority' }).click()",
      "page.getByRole('radio', { name: /^Status/ }).click()"
    ],
    "mutation_and_revert": {
      "mutate": [
        "page.getByRole('button', { name: 'Group by Status' }).click()",
        "page.getByRole('radio', { name: 'Priority' }).click()"
      ],
      "verify_post": [
        "await expect(page).toHaveURL(/groupBy=priority/)",
        "await expect(page.getByRole('button', { name: 'Group by Priority' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'Highest' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'High' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'Medium' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'Low' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'Lowest' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Card actions on Task AUT-1 of the High column' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Save or reset view settings' })).toBeVisible()"
      ],
      "revert": [
        "page.getByRole('button', { name: 'Group by Priority' }).click()",
        "page.getByRole('radio', { name: /^Status/ }).click()"
      ],
      "verify_revert": [
        "await expect(page).toHaveURL(/groupBy=status/)",
        "await expect(page.getByRole('button', { name: 'Group by Status' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'In Progress' })).toBeVisible()",
        "await expect(page.getByRole('heading', { level: 3, name: 'Done' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Card actions on Task AUT-1 of the To Do column' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Save or reset view settings' })).toHaveCount(0)"
      ]
    }
  },
  "notes": "Feature largely verified but one sub-claim is factually wrong: AUT-1's priority is High (card shows a 'Priority: High' button), not Medium. Therefore under groupBy=priority, AUT-1 appears in the 'High' column and its card-actions aria-label becomes 'Card actions on Task AUT-1 of the High column' — NOT 'Medium column' as stated in how_to_verify. The spec must assert the 'High column' wording to pass. All other observable claims (URL change, toolbar button rename, the five priority column headings in order, emergence of 'Save or reset view settings' button, full revert to Status grouping) were directly observed. Status radio in the open menu has accessible name 'Status Selected' when checked, so use a regex /^Status/ to target it reliably.",
  "turns": 14,
  "stopped_for_budget": false
}
```

Constraints:
  - Edit only under src/, public/, or prompts/.
  - No new dependencies. No package.json edits.
  - Keep the change tightly scoped to this feature.

## Worker summary

I edited `src/App.tsx` with six coordinated changes: (1) added `'category'` to `GroupByMode`, (2) made `groupBy` initial state read from the URL `?groupBy=` param, (3) added a `useEffect` to sync `groupBy` → URL via `history.replaceState`, (4) gave the Group-by toolbar button a dynamic `aria-label="Group by {Mode}"`, `aria-haspopup="true"`, and dynamic `aria-expanded`, (5) replaced the `MenuButton` list in its popover with a proper `role="radiogroup" aria-label="Group by field"` containing four `<input type="radio">` options (Assignee, Category, Priority, Status), (6) added a conditionally-rendered `"Save or reset view settings"` button that appears when `groupBy !== 'status'`, and (7) added a "Card actions on Task {key} of the {column} column" button to every board card.

## Browser re-verification

- status: FAIL
- turns:  15
- notes:  browser agent did not emit parseable JSON. raw: Revert confirmed: - URL: `groupBy=status` - Columns: "To Do" (1), "In Progress" (0), "Done" (0) - AUT-1 in To Do, "Card actions on Task AUT-1 of the To Do column" - Group by button: "Group by Status" - "Save or reset view settings" button is NOT visible (still shown after click revert) — actually I notice the toolbar now only has "View settings" / "M
