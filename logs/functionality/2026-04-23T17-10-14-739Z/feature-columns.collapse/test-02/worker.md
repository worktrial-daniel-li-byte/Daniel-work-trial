# Feature columns.collapse — attempt 02

## Task to worker

Your previous attempt at tests/board/columns.collapse.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Runner exitCode=1
assertions: 12 / required 2
reason: playwright test exited with code 1
----- STDOUT (last ~8KB) -----

Running 1 test using 1 worker

  ✘  1 tests/board/columns.collapse.spec.mjs:4:3 › columns.collapse — Each column has a collapse toggle › collapse buttons present for every status column, toggle state mutates and reverts (15.0s)


  1) tests/board/columns.collapse.spec.mjs:4:3 › columns.collapse — Each column has a collapse toggle › collapse buttons present for every status column, toggle state mutates and reverts 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator:  getByRole('button', { name: 'Collapse To Do' })
    Expected: visible
    Received: hidden
    Timeout:  10000ms

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for getByRole('button', { name: 'Collapse To Do' })[22m
    [2m    13 × locator resolved to <button type="button" class="_ymio1r31 _ypr0glyw _zcxs1o36 _mizu194a _1ah3dkaa _ra3xnqa1 _128mdkaa _1cvmnqa1 _4davt94y _19itglyw _vchhusvi _r06hglyw _80omtlke _2rkofajl _11c8fhey _v5649dqc _189eidpf _1rjc12x7 _1e0c116y _1bsbviql _p12f1osq _kqswh2mm _4cvr1q9y _1bah1h6o _gy1p1b66 _1o9zidpf _4t3iviql _k48p1wq8 _y4tize3t _bozgze3t _y3gn1h6o _s7n4nkob _14mj1kw7 _9v7aze3t _1tv3nqa1 _39yqe4h9 _11fnglyw _18postnw _bfhk1w7a _syazazsu _1053azsu _f8pjazsu _30l3azsu _9h8hazsu _irr31dpa _1di6fcek _4bfu18uv _1hmsgl…>…</button>[22m
    [2m       - unexpected value "hidden"[22m


      14 |     const collapseDoneBtn      = page.getByRole('button', { name: 'Collapse Done' })
      15 |
    > 16 |     await expect(collapseToDoBtn).toBeVisible()
         |                                   ^
      17 |     await expect(collapseInProgBtn).toBeVisible()
      18 |     await expect(collapseDoneBtn).toBeVisible()
      19 |
        at /Users/fleet/fleet-trial/tests/board/columns.collapse.spec.mjs:16:35

    Error Context: test-results/board-columns.collapse-col-f8a86-e-state-mutates-and-reverts/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/board-columns.collapse-col-f8a86-e-state-mutates-and-reverts/trace.zip
    Usage:

        npx playwright show-trace test-results/board-columns.collapse-col-f8a86-e-state-mutates-and-reverts/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/board/columns.collapse.spec.mjs:4:3 › columns.collapse — Each column has a collapse toggle › collapse buttons present for every status column, toggle state mutates and reverts 

----- STDERR (last ~4KB) -----
(node:72514) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:72514) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "columns.collapse",
  "feature": "Each column has a collapse toggle",
  "how_to_verify": "Snapshot: role=button name='Collapse {Status}' per column.",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "columns.collapse",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "role=heading level=3 name='To Do' is visible on the board",
    "role=heading level=3 name='In Progress' is visible on the board",
    "role=heading level=3 name='Done' is visible on the board",
    "role=button name='Collapse To Do' exists next to the 'To Do' heading",
    "role=button name='Collapse In Progress' exists next to the 'In Progress' heading",
    "role=button name='Collapse Done' exists next to the 'Done' heading",
    "After clicking 'Collapse To Do', the button's accessible name changes to 'Expand To Do' and the column is rendered in a collapsed state (heading 'To Do' still present, card list hidden)",
    "Clicking 'Expand To Do' reverts the column: all three buttons are again 'Collapse To Do', 'Collapse In Progress', 'Collapse Done'",
    "Other sibling button present per column: 'More actions for column {Status}'"
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
        "purpose": "Collapse toggle for To Do column",
        "preferred": "getByRole('button', { name: 'Collapse To Do' })",
        "fallback": "locator('button[aria-label=\"Collapse To Do\"]')"
      },
      {
        "purpose": "Collapse toggle for In Progress column",
        "preferred": "getByRole('button', { name: 'Collapse In Progress' })",
        "fallback": "locator('button[aria-label=\"Collapse In Progress\"]')"
      },
      {
        "purpose": "Collapse toggle for Done column",
        "preferred": "getByRole('button', { name: 'Collapse Done' })",
        "fallback": "locator('button[aria-label=\"Collapse Done\"]')"
      },
      {
        "purpose": "Expand toggle shown after To Do column is collapsed",
        "preferred": "getByRole('button', { name: 'Expand To Do' })",
        "fallback": "locator('button[aria-label=\"Expand To Do\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Collapse In Progress' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Collapse Done' })).toBeVisible()"
    ],
    "mutation_and_revert": {
      "mutate": [
        "await page.getByRole('button', { name: 'Collapse To Do' }).click()"
      ],
      "verify_post": [
        "await expect(page.getByRole('button', { name: 'Expand To Do' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Collapse To Do' })).toHaveCount(0)"
      ],
      "revert": [
        "await page.getByRole('button', { name: 'Expand To Do' }).click()"
      ],
      "verify_revert": [
        "await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()",
        "await expect(page.getByRole('button', { name: 'Expand To Do' })).toHaveCount(0)"
      ]
    }
  },
  "notes": "Each column header contains a 'Collapse {Status}' button alongside a 'More actions for column {Status}' button and an 'Edit {Status} status column, edit' button. When a column is collapsed, its heading (role=heading, level=3) remains present but the card list is hidden and the collapse button toggles to 'Expand {Status}'. Observed column names: 'To Do' (count 1), 'In Progress' (count 0), 'Done' (count 0). A persistent sidebar button 'Collapse sidebar' also exists and must not be confused with column collapse buttons; always scope column-collapse locators by the per-status accessible name.",
  "turns": 10,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/columns.collapse.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The root cause was that Jira CSS-hides the collapse buttons until a column header is hovered. I fixed `tests/board/columns.collapse.spec.mjs` by adding `await <heading>.hover()` before every `toBeVisible()` check and before the `.click()` on the collapse button — this triggers the ancestor `:hover` state that reveals the action buttons — while keeping the full mutate → verify-post → revert → verify-revert sequence intact across 7 `expect()` calls.

## Runner

- exit code: 0
- assertions counted: 7
- passed: true
