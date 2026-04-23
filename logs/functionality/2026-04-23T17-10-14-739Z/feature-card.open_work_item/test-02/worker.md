# Feature card.open_work_item — attempt 02

## Task to worker

Your previous attempt at tests/board/card.open_work_item.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Spec passed initially, but the mutation check FAILED — the test is
not load-bearing. Rewrite the spec with stricter assertions that
target the specific DOM surfaces the feature produces (role+name,
exact visible text, exact URL fragment, computed attributes).

Diagnostic: spec STAYED GREEN after feature was removed — the test is not load-bearing. Tighten its assertions against the specific DOM the feature produces.

Saboteur summary: Removed the `href` attribute from the card `<a>` tag in `src/App.tsx` (line 2713). Without `href`, the element loses its implicit `role="link"`, so Playwright's `getByRole('link', { name: 'AUT-1 …' })` will no longer find it and the spec fails at assertion 2.

----- RUNNER (post-sabotage) -----
exitCode=0 passed=true

Running 1 test using 1 worker

  ✓  1 tests/board/card.open_work_item.spec.mjs:4:3 › card.open_work_item — Clicking the card opens the work item › clicking AUT-1 card link opens a work-item dialog and appends selectedIssue=AUT-1 to the URL (3.8s)

  1 passed (4.1s)


----- RUNNER (post-revert) -----
exitCode=0 passed=true

Running 1 test using 1 worker

  ✓  1 tests/board/card.open_work_item.spec.mjs:4:3 › card.open_work_item — Clicking the card opens the work item › clicking AUT-1 card link opens a work-item dialog and appends selectedIssue=AUT-1 to the URL (3.2s)

  1 passed (3.5s)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "card.open_work_item",
  "feature": "Clicking the card opens the work item",
  "how_to_verify": "Snapshot: role=link name='{KEY} {summary}. Use the enter key to load the work item.' — Enter/click navigates to the work-item view.",
  "action_is_mutating": false,
  "status": "pass_presence_only"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "card.open_work_item",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "Initial page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "role=link name='AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.' visible inside the To Do column list, with href='/browse/AUT-1'",
    "role=heading level=3 name='To Do' visible above the card list",
    "After clicking the AUT-1 card link, page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status&selectedIssue=AUT-1' (query param selectedIssue=AUT-1 appended)",
    "A role=dialog appears after the click; its innerText starts with 'Add epic\\nAUT-1\\n1\\nShare\\nActions\\nSwitch to sidebar\\nClose\\nDesign autonomous replanning loop'",
    "Dialog contains a 'Description' section with text 'Define the state machine for the replanner: observe → plan → act → verify. Include cancellation semantics and timeouts.'",
    "Dialog contains a 'Close' button and status chip 'To Do'"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "AUT-1 card link on the board (the click target)",
        "preferred": "getByRole('link', { name: 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.' })",
        "fallback": "locator('a[href=\"/browse/AUT-1\"]')"
      },
      {
        "purpose": "To Do column heading (context assertion)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      },
      {
        "purpose": "Work item dialog that opens after clicking the card",
        "preferred": "getByRole('dialog')",
        "fallback": "locator('[role=\"dialog\"]')"
      },
      {
        "purpose": "Work item summary shown inside the dialog",
        "preferred": "getByRole('dialog').getByText('Design autonomous replanning loop')",
        "fallback": "getByText('Design autonomous replanning loop')"
      },
      {
        "purpose": "Close button inside the work item dialog",
        "preferred": "getByRole('dialog').getByRole('button', { name: 'Close' })",
        "fallback": "locator('[role=\"dialog\"] button[aria-label=\"Close\"]')"
      }
    ],
    "url_assertions": [
      "selectedIssue=AUT-1",
      "/jira/core/projects/AUT/board"
    ],
    "interactions": [
      "await page.getByRole('link', { name: 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.' }).click()",
      "await expect(page).toHaveURL(/selectedIssue=AUT-1/)",
      "await expect(page.getByRole('dialog')).toBeVisible()",
      "await expect(page.getByRole('dialog').getByText('Design autonomous replanning loop')).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "The work item opens as a modal/side panel role=dialog (not a full-page navigation), and the board URL gains ?...&selectedIssue=AUT-1. The dialog has no aria-label, so assert via getByRole('dialog') plus inner text. Page shows console errors unrelated to this check. Only one card (AUT-1) is present on the board in the To Do column (count badge '1'); In Progress and Done are empty.",
  "turns": 6,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/card.open_work_item.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I rewrote `tests/board/card.open_work_item.spec.mjs` with two load-bearing anchor assertions — `page.locator('a[href="/browse/AUT-1"]').toBeVisible()` (the CSS `[href]` selector cannot resolve if the attribute is absent) and `toHaveAttribute('href', '/browse/AUT-1')` (explicit value check) — so removing `href` from the `<a>` tag now causes the spec to fail at assertions 2/3 before any click handler can save it, while still verifying the `role=link` ARIA surface, URL change, dialog visibility, and dialog content.

## Runner

- exit code: 0
- assertions counted: 10
- passed: true
