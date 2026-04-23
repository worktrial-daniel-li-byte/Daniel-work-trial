# Feature card.fields_visible — implementation attempt 03

## Task to implementation worker

Your previous implementation attempt did not make the feature pass. The browser agent re-verified and still reports a problem — see "latest_evidence" below for the current DOM state, and "previous_attempt_summary" for what you just did. Adjust course and try a different change.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "card.fields_visible",
  "feature": "Card visually surfaces expected fields",
  "how_to_verify": "Inspect card for AUT-1.",
  "expect_fields": [
    "summary ('This is a test')",
    "key badge (icon + 'AUT-1')",
    "priority icon (default Medium)",
    "assignee avatar (None -> generic person icon)"
  ],
  "notes": "When status=Done, the key badge shows a green check mark next to AUT-1.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (latest, ground truth for the current DOM):
```json
{
  "id": "card.fields_visible",
  "status": "PARTIAL",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "role=heading level=3 name='To Do' is visible in the first column",
    "role=heading level=3 name='In Progress' is visible",
    "role=heading level=3 name='Done' is visible",
    "To Do column shows count badge '1' (only one card)",
    "AUT-1 card is present as a listitem inside the To Do column list",
    "Card contains link with accessible name 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.' pointing to /browse/AUT-1",
    "Card summary text visible: 'Design autonomous replanning loop' (NOT 'This is a test' as the spec asserted)",
    "Card contains img with alt/name 'Task' (the key badge icon) followed by visible text 'AUT-1'",
    "Card contains a button with accessible name 'Priority: High' containing an img 'Priority: High' (NOT 'Medium' as the spec asserted 'default Medium')",
    "Card contains a button with accessible name 'Assignee: None' (matches expectation of None/generic avatar)",
    "Card has an 'Edit summary' button and a 'Card actions on Task AUT-1 of the To Do column' button",
    "AUT-1 is in status To Do, so the Done-state green check badge could not be observed this session"
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
        "purpose": "AUT-1 card link (key + summary)",
        "preferred": "getByRole('link', { name: /AUT-1 Design autonomous replanning loop/ })",
        "fallback": "locator('a[href=\"/browse/AUT-1\"]')"
      },
      {
        "purpose": "AUT-1 summary text on card",
        "preferred": "getByText('Design autonomous replanning loop')",
        "fallback": "locator('text=Design autonomous replanning loop')"
      },
      {
        "purpose": "Task icon (key badge icon)",
        "preferred": "getByRole('img', { name: 'Task' })",
        "fallback": "locator('img[alt=\"Task\"]')"
      },
      {
        "purpose": "AUT-1 key text badge",
        "preferred": "getByText('AUT-1', { exact: true })",
        "fallback": "locator('text=AUT-1')"
      },
      {
        "purpose": "Priority indicator on card (actually 'High', not 'Medium')",
        "preferred": "getByRole('button', { name: 'Priority: High' })",
        "fallback": "locator('button[aria-label^=\"Priority:\"]')"
      },
      {
        "purpose": "Assignee avatar/button on card (None)",
        "preferred": "getByRole('button', { name: 'Assignee: None' })",
        "fallback": "locator('button[aria-label^=\"Assignee:\"]')"
      },
      {
        "purpose": "Card actions button (scoping locator for the card)",
        "preferred": "getByRole('button', { name: 'Card actions on Task AUT-1 of the To Do column' })",
        "fallback": "locator('[aria-label*=\"Card actions on Task AUT-1\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "page.goto(navigate_url)",
      "await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()",
      "await expect(page.getByRole('link', { name: /AUT-1 Design autonomous replanning loop/ })).toBeVisible()",
      "await expect(page.getByRole('img', { name: 'Task' })).toBeVisible()",
      "await expect(page.getByText('AUT-1', { exact: true })).toBeVisible()",
      "await expect(page.getByRole('button', { name: /^Priority: / })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Assignee: None' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "PARTIAL: All four field categories (summary, key badge, priority icon, assignee avatar) are visually surfaced on the AUT-1 card. However the spec's parenthetical expected values do not match the live data: actual summary is 'Design autonomous replanning loop' (not 'This is a test'), and actual priority is 'High' (not the default 'Medium'). The Done-state green check claim could not be validated because AUT-1 is currently in 'To Do'. Recommend the generated spec assert on field *presence* (role/aria-label patterns) rather than exact literal values for summary/priority; or update the fixture expectations to match current state.",
  "turns": 4,
  "stopped_for_budget": false
}
```

PREVIOUS ATTEMPT SUMMARY:
Attempt 2 summary: The fix is correctly applied. The `jira-card__meta` div (containing the key badge, priority button, and assignee button) is now outside the `jira-card__open` button, eliminating the invalid button-in-button HTML nesting.

I edited `src/App.tsx` to move the `jira-card__meta` div (containing the Task icon, key badge `AUT-1`, priority button `Priority: Medium`, and assignee button `Assignee: None`) outside the `jira-card__open` button, fixing the invalid button-inside-button HTML nesting that was causing the card fields to be inaccessible as interactive elements.
Browser re-verification status: PARTIAL
Notes: PARTIAL: All four field categories (summary, key badge, priority icon, assignee avatar) are visually surfaced on the AUT-1 card. However the spec's parenthetical expected values do not match the live data: actual summary is 'Design autonomous replanning loop' (not 'This is a test'), and actual priority is 'High' (not the default 'Medium'). The Done-state green check claim could not be validated because AUT-1 is currently in 'To Do'. Recommend the generated spec assert on field *presence* (role/aria-label patterns) rather than exact literal values for summary/priority; or update the fixture expectations to match current state.

Constraints:
  - Edit only under src/, public/, or prompts/.
  - No new dependencies. No package.json edits.
  - Keep the change tightly scoped to this feature.

## Worker summary

Seed data is correct. I bumped `STORAGE_VERSION` from `3` to `4` in `src/App.tsx` so that any browser profile holding stale version-3 localStorage (with 'Design autonomous replanning loop' / High priority) discards it and re-initializes from `INITIAL_COLUMNS`, which already has the correct values: title `'This is a test'`, priority `'medium'`, `assigneeId: null` (renders as `'Assignee: None'`).

## Browser re-verification

- status: PARTIAL
- turns:  6
- notes:  Feature structure is observable (summary text, key+icon badge, priority icon, assignee avatar all render on the AUT-1 card). However, two expected values in the spec are WRONG for this environment: (1) summary is 'Design autonomous replanning loop', not 'This is a test'; (2) priority is 'High', not the default 'Medium'. Specs should either assert the actual values above or assert presence/shape (r
