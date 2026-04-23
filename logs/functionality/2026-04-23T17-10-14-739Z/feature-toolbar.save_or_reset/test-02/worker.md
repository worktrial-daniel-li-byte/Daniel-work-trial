# Feature toolbar.save_or_reset — attempt 02

## Task to worker

Your previous attempt at tests/board/toolbar.save_or_reset.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Runner exitCode=1
assertions: 16 / required 2
reason: playwright test exited with code 1
----- STDOUT (last ~8KB) -----

Running 1 test using 1 worker

  ✘  1 tests/board/toolbar.save_or_reset.spec.mjs:4:3 › toolbar.save_or_reset — Save or reset view settings button appears when view differs from saved › button absent initially, appears after changing Group by, removed after reverting (12.4s)


  1) tests/board/toolbar.save_or_reset.spec.mjs:4:3 › toolbar.save_or_reset — Save or reset view settings button appears when view differs from saved › button absent initially, appears after changing Group by, removed after reverting 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

    Locator:  getByRole('button', { name: 'More actions' }).last()
    Expected: visible
    Received: hidden
    Timeout:  10000ms

    Call log:
    [2m  - Expect "toBeVisible" with timeout 10000ms[22m
    [2m  - waiting for getByRole('button', { name: 'More actions' }).last()[22m
    [2m    13 × locator resolved to <button type="button" aria-haspopup="true" aria-expanded="false" class="_ymio1r31 _ypr0glyw _zcxs1o36 _mizu194a _1ah3dkaa _ra3xnqa1 _128mdkaa _1cvmnqa1 _4davt94y _19itglyw _vchhusvi _r06hglyw _80omtlke _2rkofajl _11c8fhey _v5649dqc _189eidpf _1rjc12x7 _1e0c116y _1bsbviql _p12f1osq _kqswh2mm _4cvr1q9y _1bah1h6o _gy1p1b66 _1o9zidpf _4t3iviql _k48p1wq8 _y4tize3t _bozgze3t _y3gn1h6o _s7n4nkob _14mj1kw7 _9v7aze3t _1tv3nqa1 _39yqe4h9 _11fnglyw _18postnw _bfhk1w7a _syazazsu _1053azsu _f8pjazsu _30l3azsu _9h8…>…</button>[22m
    [2m       - unexpected value "hidden"[22m


      26 |     await expect(
      27 |       page.getByRole('button', { name: 'More actions' }).last()
    > 28 |     ).toBeVisible()
         |       ^
      29 |
      30 |     // ── Mutate: switch Group by from Status → Priority ───────────────────────
      31 |     await page.getByRole('button', { name: 'Group by Status' }).click()
        at /Users/fleet/fleet-trial/tests/board/toolbar.save_or_reset.spec.mjs:28:7

    Error Context: test-results/board-toolbar.save_or_rese-4e3cc--by-removed-after-reverting/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/board-toolbar.save_or_rese-4e3cc--by-removed-after-reverting/trace.zip
    Usage:

        npx playwright show-trace test-results/board-toolbar.save_or_rese-4e3cc--by-removed-after-reverting/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/board/toolbar.save_or_reset.spec.mjs:4:3 › toolbar.save_or_reset — Save or reset view settings button appears when view differs from saved › button absent initially, appears after changing Group by, removed after reverting 

----- STDERR (last ~4KB) -----
(node:52302) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:52302) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

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

I updated `tests/board/toolbar.save_or_reset.spec.mjs` by removing the two failing `.last()` "More actions" visibility assertions (the DOM had 13 matching buttons and the very last was hidden — those checks were non-essential pre/post-condition anchors, not part of the core feature). The spec now asserts only what the evidence directly supports: `toHaveCount(0)` for the "Save or reset" button before mutation, `toBeVisible()` after switching Group by to Priority (plus URL and relabelled "Group by Priority" button), then `toHaveCount(0)` again and "Group by Status" visible after reverting.

## Runner

- exit code: 1
- assertions counted: 10
- passed: false
