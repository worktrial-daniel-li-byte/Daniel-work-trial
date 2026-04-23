# Feature page.load — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/calendar/page.load.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "page.load",
  "feature": "Calendar tab loads under AUT project with Calendar tab marked active",
  "how_to_verify": "Navigate to /jira/core/projects/AUT/calendar and assert the Space navigation has a heading level=2 named 'Calendar' (active tab) and siblings link to Summary, Board, List, Timeline, Approvals, Forms, Docs.",
  "expect_url_contains": "/jira/core/projects/AUT/calendar",
  "expect_sections": [
    "Summary",
    "Board",
    "List",
    "Calendar",
    "Timeline",
    "Approvals",
    "Forms",
    "Docs"
  ],
  "action_is_mutating": false,
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "page.load",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar'",
    "page title is 'Calendar - Jira'",
    "navigation with accessible name 'Space navigation' is present (ref=e282)",
    "within Space navigation, heading level=2 name='Calendar' is visible (the active tab, rendered as heading not link)",
    "within Space navigation, link 'Summary' with href '/jira/core/projects/AUT/summary' is visible",
    "within Space navigation, link 'Board' with href '/jira/core/projects/AUT/board' is visible",
    "within Space navigation, link 'List' with href '/jira/core/projects/AUT/list' is visible",
    "within Space navigation, link 'Timeline' with href '/jira/core/projects/AUT/timeline' is visible",
    "within Space navigation, link 'Approvals' with href '/jira/core/projects/AUT/approvals' is visible",
    "within Space navigation, link 'Forms' with href '/jira/core/projects/AUT/form' is visible",
    "within Space navigation, link 'Docs' with href '/jira/core/projects/AUT/pages' is visible",
    "heading level=1 name='Autoloop' is visible as the project title",
    "heading level=3 name='Apr 2026' is visible in the calendar toolbar",
    "a grid element is rendered with columnheaders Monday, Tuesday, Wednesday, Thursday, Friday",
    "button '4 more tabs' is present next to the tab list indicating some tabs may be in overflow at this viewport"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Space navigation container",
        "preferred": "getByRole('navigation', { name: 'Space navigation' })",
        "fallback": "locator('nav[aria-label=\"Space navigation\"]')"
      },
      {
        "purpose": "Active Calendar tab (rendered as heading)",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('heading', { level: 2, name: 'Calendar' })",
        "fallback": "getByRole('heading', { level: 2, name: 'Calendar' })"
      },
      {
        "purpose": "Summary tab link",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'Summary' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/summary\"]')"
      },
      {
        "purpose": "Board tab link",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'Board' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/board\"]')"
      },
      {
        "purpose": "List tab link",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'List' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/list\"]')"
      },
      {
        "purpose": "Timeline tab link",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'Timeline' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/timeline\"]')"
      },
      {
        "purpose": "Approvals tab link",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'Approvals' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/approvals\"]')"
      },
      {
        "purpose": "Forms tab link (href uses /form singular)",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'Forms' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/form\"]')"
      },
      {
        "purpose": "Docs tab link (href is /pages)",
        "preferred": "getByRole('navigation', { name: 'Space navigation' }).getByRole('link', { name: 'Docs' })",
        "fallback": "locator('a[href=\"/jira/core/projects/AUT/pages\"]')"
      },
      {
        "purpose": "Project title 'Autoloop'",
        "preferred": "getByRole('heading', { level: 1, name: 'Autoloop' })",
        "fallback": "getByText('Autoloop', { exact: true })"
      },
      {
        "purpose": "Calendar month header",
        "preferred": "getByRole('heading', { level: 3, name: /\\w{3} \\d{4}/ })",
        "fallback": "locator('[role=\"grid\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/calendar"
    ],
    "interactions": [
      "page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar')"
    ],
    "mutation_and_revert": null
  },
  "notes": "The Calendar tab is rendered as a heading level=2 (not a link) to indicate active state; all other tabs render as role=link. A '4 more tabs' overflow button is visible next to the tab strip, but at the tested viewport (default) Summary/Board/List/Calendar/Timeline/Approvals/Forms/Docs were all directly visible in the DOM inside the Space navigation list. At narrower viewports some of these may collapse into the More menu, so assert their role within the nav rather than strict visibility if flakiness occurs. The Forms tab's href is '/jira/core/projects/AUT/form' (singular) and Docs's href is '/jira/core/projects/AUT/pages'.",
  "turns": 7,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/calendar/page.load.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

I wrote `tests/calendar/page.load.spec.mjs`, which asserts: the page URL and title match the Calendar view, the Space navigation contains a level-2 heading `"Calendar"` (active tab) alongside seven sibling role=link tabs (Summary, Board, List, Timeline, Approvals, Forms, Docs), the project title heading `"Autoloop"` is visible, and the calendar grid renders with Monday and Friday column headers.

## Runner

- exit code: 1
- assertions counted: 15
- passed: false
