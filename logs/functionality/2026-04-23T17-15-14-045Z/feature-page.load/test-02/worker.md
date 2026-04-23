# Feature page.load — attempt 02

## Task to worker

Your previous attempt at tests/calendar/page.load.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Runner exitCode=1
assertions: 15 / required 2
reason: playwright test exited with code 1
----- STDOUT (last ~8KB) -----

Running 1 test using 1 worker

  ✘  1 tests/calendar/page.load.spec.mjs:4:3 › page.load — Calendar tab loads under AUT project with Calendar tab marked active › calendar page loads with active Calendar heading and all sibling tab links visible (13.4s)


  1) tests/calendar/page.load.spec.mjs:4:3 › page.load — Calendar tab loads under AUT project with Calendar tab marked active › calendar page loads with active Calendar heading and all sibling tab links visible 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: locator('[role="grid"]')
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for locator('[role="grid"]')[22m


      34 |     // Calendar grid (month view) must be rendered with weekday column headers
      35 |     const grid = page.locator('[role="grid"]')
    > 36 |     await expect(grid).toBeVisible()
         |                        ^
      37 |     await expect(page.getByRole('columnheader', { name: 'Monday' })).toBeVisible()
      38 |     await expect(page.getByRole('columnheader', { name: 'Friday' })).toBeVisible()
      39 |   })
        at /Users/fleet/fleet-trial/tests/calendar/page.load.spec.mjs:36:24

    Error Context: test-results/calendar-page.load-page-lo-52e64-l-sibling-tab-links-visible/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/calendar-page.load-page-lo-52e64-l-sibling-tab-links-visible/trace.zip
    Usage:

        npx playwright show-trace test-results/calendar-page.load-page-lo-52e64-l-sibling-tab-links-visible/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/calendar/page.load.spec.mjs:4:3 › page.load — Calendar tab loads under AUT project with Calendar tab marked active › calendar page loads with active Calendar heading and all sibling tab links visible 

----- STDERR (last ~4KB) -----
(node:73894) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:73894) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

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

I updated `tests/calendar/page.load.spec.mjs`, replacing the failing `[role="grid"]` + column-header assertions with `getByRole('heading', { level: 3, name: /\w{3} \d{4}/ })` — the evidence-preferred locator for the calendar toolbar month heading (e.g. "Apr 2026") — which directly confirms the calendar view has rendered without relying on a grid ARIA role that isn't present in the live DOM.

## Runner

- exit code: 0
- assertions counted: 13
- passed: true
