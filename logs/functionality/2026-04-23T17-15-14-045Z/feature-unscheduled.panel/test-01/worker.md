# Feature unscheduled.panel — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/calendar/unscheduled.panel.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "unscheduled.panel",
  "feature": "Unscheduled work side panel lists items lacking a due date and supports drag-to-schedule",
  "how_to_verify": "With the panel open, assert a complementary region named 'Unscheduled work' with a heading level=2 'Unscheduled work', the helper text 'Drag each work item onto the calendar to set a due date for the work.', and a 'Close panel' button.",
  "expect_sections": [
    "Unscheduled work"
  ],
  "expect_fields": [
    "Close panel"
  ],
  "action_is_mutating": false,
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "unscheduled.panel",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar",
  "observations": [
    "page.url() === https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar",
    "role=complementary with accessible name 'Unscheduled work' is present in the DOM (ref=e933)",
    "role=heading level=2 with name 'Unscheduled work' is visible inside the complementary region (ref=e936)",
    "Exact helper text 'Drag each work item onto the calendar to set a due date for the work.' is visible inside the complementary region",
    "role=button with name 'Close panel' is visible inside the complementary region (ref=e938)",
    "The toolbar also exposes a button 'Unscheduled work' (ref=e524) used to toggle the panel; the panel appeared open by default on load",
    "Inside the panel a textbox with placeholder 'Search unscheduled items' is visible",
    "Inside the panel a list contains link 'AUT-1' with work item name 'Design autonomous replanning loop' (status 'To Do', 'High priority'), confirming unscheduled items are listed"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Unscheduled work side panel (complementary region)",
        "preferred": "getByRole('complementary', { name: 'Unscheduled work' })",
        "fallback": "locator('[aria-label=\"Unscheduled work\"]')"
      },
      {
        "purpose": "Unscheduled work heading inside the panel",
        "preferred": "getByRole('complementary', { name: 'Unscheduled work' }).getByRole('heading', { level: 2, name: 'Unscheduled work' })",
        "fallback": "getByRole('heading', { level: 2, name: 'Unscheduled work' })"
      },
      {
        "purpose": "Helper / instructional text in the panel",
        "preferred": "getByText('Drag each work item onto the calendar to set a due date for the work.')",
        "fallback": "locator('text=Drag each work item onto the calendar to set a due date for the work.')"
      },
      {
        "purpose": "Close panel button",
        "preferred": "getByRole('complementary', { name: 'Unscheduled work' }).getByRole('button', { name: 'Close panel' })",
        "fallback": "getByRole('button', { name: 'Close panel' })"
      },
      {
        "purpose": "Toolbar toggle that opens the Unscheduled work panel (in case panel is closed)",
        "preferred": "getByRole('button', { name: 'Unscheduled work' })",
        "fallback": "locator('button:has-text(\"Unscheduled work\")')"
      },
      {
        "purpose": "Example unscheduled work item link (AUT-1)",
        "preferred": "getByRole('complementary', { name: 'Unscheduled work' }).getByRole('link', { name: 'AUT-1' })",
        "fallback": "getByRole('link', { name: 'AUT-1' })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/calendar"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar')",
      "// If the panel is not open by default, click the toolbar toggle: await page.getByRole('button', { name: 'Unscheduled work' }).first().click()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Panel was open by default on page load in this session, so no click was required to reveal it. The toolbar toggle button 'Unscheduled work' shares its accessible name with the panel heading — use .first() or scope by role=complementary to disambiguate. Close panel button has only an icon image with alt 'Close panel' providing its accessible name.",
  "turns": 3,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/calendar/unscheduled.panel.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

Wrote `tests/calendar/unscheduled.panel.spec.mjs` with four `expect()` assertions: (1) the `role=complementary` region named `'Unscheduled work'` is visible, (2) a `level=2` heading `'Unscheduled work'` is visible inside it, (3) the exact drag-to-schedule helper text is visible, and (4) the `'Close panel'` button is visible — with a guard that clicks the toolbar toggle first if the panel isn't already open on load.

## Runner

- exit code: 1
- assertions counted: 4
- passed: false
