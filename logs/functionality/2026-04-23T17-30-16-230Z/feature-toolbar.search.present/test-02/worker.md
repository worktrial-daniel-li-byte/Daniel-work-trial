# Feature toolbar.search.present — attempt 02

## Task to worker

Your previous attempt at tests/board/toolbar.search.present.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Runner exitCode=1
assertions: 4 / required 2
reason: playwright test exited with code 1
----- STDOUT (last ~8KB) -----

Running 1 test using 1 worker

  ✘  1 tests/board/toolbar.search.present.spec.mjs:4:3 › toolbar.search.present — Toolbar has a 'Search board' textbox › Search board textbox is visible in the board filter toolbar (2.4s)


  1) tests/board/toolbar.search.present.spec.mjs:4:3 › toolbar.search.present — Toolbar has a 'Search board' textbox › Search board textbox is visible in the board filter toolbar 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator: getByRole('button', { name: /Filter/i })
    Expected: visible
    Error: strict mode violation: getByRole('button', { name: /Filter/i }) resolved to 3 elements:
        1) <button type="button" aria-expanded="false" id=":R1ap9m9era9955jal5:" data-testid="NAV4_jira.sidebar.filters" class="_ymio1r31 _ypr0glyw _zcxs1o36 _mizu194a _1ah3dkaa _ra3xnqa1 _128mdkaa _1cvmnqa1 _4davt94y _19itglyw _vchhusvi _r06hglyw _80omtlke _2rko12b0 _yyhyjvu9 _1ii7kb7n _1e0c11p5 _yv0enbh3 _2z05nbh3 _y4ti1b66 _bozg1b66 _1q511b66 _85i51b66 _bfhk18uv _syazazsu _4cvr1h6o _y3gnv2br _14iu13ro _kqswh2mm">…</button> aka getByTestId('NAV4_jira.sidebar.filters')
        2) <button type="button" aria-haspopup="true" aria-expanded="false" data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger" class="_ymio1r31 _ypr0glyw _zcxs1o36 _mizu194a _1ah3dkaa _ra3xnqa1 _128mdkaa _1cvmnqa1 _4davt94y _19itglyw _vchhusvi _r06hglyw _80omtlke _2rkofajl _11c8fhey _v5649dqc _189eidpf _1rjcv77o _1e0c116y _1bsb1k8s _p12f1osq _kqswh2mm _4cvr1q9y _1bah1h6o _gy1p1b66 _1o9zidpf _4t3i1k8s _k48p1wq8 _y4tize3t _bozgze3t _y3gn1h6o _s7n4nk…>…</button> aka getByTestId('NAV4_jira.sidebar.filters-container').getByTestId('navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger')
        3) <button tabindex="0" type="button" aria-haspopup="true" aria-expanded="false" aria-label="0 filters applied" data-testid="business-filters.ui.filters.trigger.button-wrapper" class="_1qt3kjry _1g9h1tex _1umfuwj9 _6l8r3x59 _9se5176f _12rallho _zk5uzt2a _18vg2zyf _192e1jcw _fnp717ga _1xjgvy9e _1u0u14e8 _17z218zq _7n83frbu _n2ul1jo4 _1cf1r7td _1d7c1ag4 _nwukvy9e _fsjd4zrn _z1i3eyly css-1psnbih">…</button> aka getByTestId('business-filters.ui.filters.trigger.button-wrapper')

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for getByRole('button', { name: /Filter/i })[22m


      15 |
      16 |     // Confirm the surrounding toolbar context: Filter button is present
    > 17 |     await expect(page.getByRole('button', { name: /Filter/i })).toBeVisible()
         |                                                                 ^
      18 |   })
      19 | })
      20 |
        at /Users/fleet/fleet-trial/tests/board/toolbar.search.present.spec.mjs:17:65

    Error Context: test-results/board-toolbar.search.prese-ca417-in-the-board-filter-toolbar/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/board-toolbar.search.prese-ca417-in-the-board-filter-toolbar/trace.zip
    Usage:

        npx playwright show-trace test-results/board-toolbar.search.prese-ca417-in-the-board-filter-toolbar/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/board/toolbar.search.present.spec.mjs:4:3 › toolbar.search.present — Toolbar has a 'Search board' textbox › Search board textbox is visible in the board filter toolbar 

----- STDERR (last ~4KB) -----
(node:89054) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:89054) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.search.present",
  "feature": "Toolbar has a 'Search board' textbox",
  "how_to_verify": "Snapshot: role=textbox name='Search board'",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.search.present",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Page title is 'Board - Autoloop - Jira'",
    "Snapshot shows 'textbox \"Search board\" [ref=e381]' inside the board toolbar region",
    "DOM inspection: element is an <INPUT type=\"text\"> with aria-label=\"Search board\" and placeholder=\"Search board\", visible on screen",
    "Adjacent status element reads 'Showing all work items', confirming the textbox sits in the board filter toolbar",
    "Nearby toolbar controls are visible: button 'Filter' ('0 filters applied'), button 'Group: Status', button 'View settings', button 'More actions'",
    "Main board columns render: heading level=3 'To Do', heading level=3 'In Progress', heading level=3 'Done'"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "The 'Search board' toolbar textbox",
        "preferred": "getByRole('textbox', { name: 'Search board' })",
        "fallback": "getByPlaceholder('Search board')"
      },
      {
        "purpose": "Status text next to the search input",
        "preferred": "getByText('Showing all work items')",
        "fallback": "locator('[role=\"status\"]', { hasText: 'Showing all work items' })"
      },
      {
        "purpose": "Board page confirmation (active Board tab)",
        "preferred": "getByRole('heading', { level: 2, name: 'Board' })",
        "fallback": "getByText('Board', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('textbox', { name: 'Search board' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Element is a native <input type=\"text\"> with aria-label=\"Search board\" (also placeholder=\"Search board\"), so getByRole('textbox', { name: 'Search board' }) is the correct accessible locator. No mutation required for this check.",
  "turns": 4,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.search.present.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The fix replaces `getByRole('button', { name: /Filter/i })` — which ambiguously matched 3 elements — with `getByLabel('0 filters applied')`, targeting the board toolbar's filter button by its exact `aria-label` as recorded in the DOM inspection evidence, eliminating the strict-mode violation while still asserting the toolbar context.

## Runner

- exit code: 0
- assertions counted: 4
- passed: true
