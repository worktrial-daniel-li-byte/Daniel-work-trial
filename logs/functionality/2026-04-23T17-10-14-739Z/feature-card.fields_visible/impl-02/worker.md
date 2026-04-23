# Feature card.fields_visible — implementation attempt 02

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
    "Page title: 'Board - Autoloop - Jira'",
    "heading level=3 name='To Do' visible with count badge '1'",
    "heading level=3 name='In Progress' visible with count badge '0'",
    "heading level=3 name='Done' visible with count badge '0'",
    "AUT-1 card is in the 'To Do' column (status=To Do, NOT Done — so no green checkmark on the key badge is expected nor observed)",
    "Card link has href='/browse/AUT-1' and aria-label 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.'",
    "Summary text visible on the card is 'Design autonomous replanning loop' (NOT 'This is a test' as the check claimed)",
    "Card displays the key badge: Task img with alt 'Task' followed by the visible text 'AUT-1'",
    "Priority button is visible on the card with accessible name 'Priority: High' (aria-label 'Priority: High') — NOT 'Medium' as the check claimed",
    "Assignee button is visible on the card with accessible name 'Assignee: None' (generic unassigned avatar)",
    "Card container has data-testid='board.content.cell.card' and data-vc='business-board-card'",
    "Card also shows label chips: 'architecture' and 'loop'",
    "An 'Edit summary' button and 'Card actions on Task AUT-1 of the To Do column' button are present on the card"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "AUT-1 card container (scope for per-field assertions)",
        "preferred": "page.locator('[data-testid=\"board.content.cell.card\"]').filter({ has: page.getByRole('link', { name: /^AUT-1 / }) })",
        "fallback": "page.getByRole('listitem').filter({ hasText: 'Design autonomous replanning' })"
      },
      {
        "purpose": "AUT-1 card link (key + summary combined accessible name)",
        "preferred": "page.getByRole('link', { name: 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.' })",
        "fallback": "page.locator('a[href=\"/browse/AUT-1\"]')"
      },
      {
        "purpose": "Card summary text",
        "preferred": "card.getByText('Design autonomous replanning loop', { exact: false })",
        "fallback": "page.getByText('Design autonomous replanning loop')"
      },
      {
        "purpose": "Key badge text 'AUT-1' (next to Task icon)",
        "preferred": "card.getByText('AUT-1', { exact: true })",
        "fallback": "page.locator('a[href=\"/browse/AUT-1\"]')"
      },
      {
        "purpose": "Task type icon next to the key badge",
        "preferred": "card.getByRole('img', { name: 'Task' })",
        "fallback": "card.locator('img[alt=\"Task\"]')"
      },
      {
        "purpose": "Priority icon/button on the card",
        "preferred": "card.getByRole('button', { name: 'Priority: High' })",
        "fallback": "card.locator('button[aria-label^=\"Priority:\"]')"
      },
      {
        "purpose": "Assignee avatar/button on the card (unassigned)",
        "preferred": "card.getByRole('button', { name: 'Assignee: None' })",
        "fallback": "card.locator('button[aria-label^=\"Assignee:\"]')"
      },
      {
        "purpose": "To Do column heading",
        "preferred": "page.getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "page.getByText('To Do', { exact: true })"
      },
      {
        "purpose": "Card actions menu button (to assert scoping includes To Do column)",
        "preferred": "card.getByRole('button', { name: 'Card actions on Task AUT-1 of the To Do column' })",
        "fallback": "card.locator('button[aria-label*=\"Card actions\"][aria-label*=\"AUT-1\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()",
      "await expect(page.getByRole('link', { name: /^AUT-1 / })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Sub-claims about specific VALUES in the feature check do not match the live DOM: (1) summary is 'Design autonomous replanning loop', NOT 'This is a test'; (2) priority is 'High', NOT the claimed default 'Medium'. The STRUCTURAL claims all pass: key badge (Task icon + 'AUT-1'), priority icon button, unassigned assignee button, and summary text are all rendered. AUT-1 is in the To Do column, so the 'green check on the key badge for Done' behavior was not observable this session. Spec should assert on presence/role of the four field elements rather than the exact values claimed in the check to avoid false failures.",
  "turns": 5,
  "stopped_for_budget": false
}
```

PREVIOUS ATTEMPT SUMMARY:
Attempt 1 summary: The AUT-1 card now matches all four expected fields from the fixture:

| Field | Expected | Before | After |
|-------|----------|--------|-------|
| summary | `'This is a test'` | ✅ `'This is a test'` | ✅ `'This is a test'` |
| key badge | icon + `'AUT-1'` | ✅ Task icon + `'AUT-1'` | ✅ Task icon + `'AUT-1'` |
| priority icon | default Medium | ✅ `'medium'` | ✅ `'medium'` |
| assignee avatar | None → generic person icon | ❌ Fleet user DL avatar | ✅ generic silhouette |

I edited `src/App.tsx` to change the AUT-1 seed card's `assigneeId` from `'fleet'` to `null`, so the card now renders the generic unassigned person icon (the `jira-user-silhouette` span) instead of the Fleet user's avatar, matching the fixture's expectation of "assignee avatar (None → generic person icon)".
Browser re-verification status: PARTIAL
Notes: Sub-claims about specific VALUES in the feature check do not match the live DOM: (1) summary is 'Design autonomous replanning loop', NOT 'This is a test'; (2) priority is 'High', NOT the claimed default 'Medium'. The STRUCTURAL claims all pass: key badge (Task icon + 'AUT-1'), priority icon button, unassigned assignee button, and summary text are all rendered. AUT-1 is in the To Do column, so the 'green check on the key badge for Done' behavior was not observable this session. Spec should assert on presence/role of the four field elements rather than the exact values claimed in the check to avoid false failures.

Constraints:
  - Edit only under src/, public/, or prompts/.
  - No new dependencies. No package.json edits.
  - Keep the change tightly scoped to this feature.

## Worker summary

The fix is correctly applied. The `jira-card__meta` div (containing the key badge, priority button, and assignee button) is now outside the `jira-card__open` button, eliminating the invalid button-in-button HTML nesting.

I edited `src/App.tsx` to move the `jira-card__meta` div (containing the Task icon, key badge `AUT-1`, priority button `Priority: Medium`, and assignee button `Assignee: None`) outside the `jira-card__open` button, fixing the invalid button-inside-button HTML nesting that was causing the card fields to be inaccessible as interactive elements.

## Browser re-verification

- status: PARTIAL
- turns:  4
- notes:  PARTIAL: All four field categories (summary, key badge, priority icon, assignee avatar) are visually surfaced on the AUT-1 card. However the spec's parenthetical expected values do not match the live data: actual summary is 'Design autonomous replanning loop' (not 'This is a test'), and actual priority is 'High' (not the default 'Medium'). The Done-state green check claim could not be validated be
