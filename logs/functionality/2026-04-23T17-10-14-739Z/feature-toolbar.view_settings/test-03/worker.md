# Feature toolbar.view_settings — attempt 03

## Task to worker

Your previous attempt at tests/board/toolbar.view_settings.spec.mjs failed. Fix it.

PREVIOUS FAILURE
----------------
Runner exitCode=1
assertions: 12 / required 2
reason: playwright test exited with code 1
----- STDOUT (last ~8KB) -----

Running 1 test using 1 worker

  ✘  1 tests/board/toolbar.view_settings.spec.mjs:4:3 › toolbar.view_settings — View settings opens a right-side panel › open panel shows heading, resize handle and close button; closing removes the panel (13.6s)


  1) tests/board/toolbar.view_settings.spec.mjs:4:3 › toolbar.view_settings — View settings opens a right-side panel › open panel shows heading, resize handle and close button; closing removes the panel 

    Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveValue[2m([22m[32mexpected[39m[2m)[22m failed

    Locator:  getByRole('complementary', { name: 'Sidebar' }).getByRole('combobox')
    Expected: [32m"Never"[39m
    Received: [31m""[39m
    Timeout:  10000ms

    Call log:
    [2m  - Expect "toHaveValue" with timeout 10000ms[22m
    [2m  - waiting for getByRole('complementary', { name: 'Sidebar' }).getByRole('combobox')[22m
    [2m    14 × locator resolved to <input value="" tabindex="0" role="combobox" inputmode="none" aria-invalid="false" aria-expanded="false" aria-haspopup="listbox" aria-autocomplete="both" id="remove-resolved-items" aria-describedby="react-select-2-single-value" data-testid="board.header.view-settings-panel.remove-resolved-items.select-select--input" class="_ca0qidpf _u5f3idpf _n3tdidpf _19bvidpf _11q7idpf _19itidpf _nd5l1sux _12ji1r31 _1qu2glyw _12y3idpf _1bsbt94y _kqswh2mm _1n5d3acm _syaz3acm _1e02p1rm _tzy4idpf _t9ec1kuz -dummyInpu…/>[22m
    [2m       - unexpected value ""[22m


      56 |     await expect(
      57 |       sidebar.getByRole('combobox')
    > 58 |     ).toHaveValue('Never')
         |       ^
      59 |
      60 |     // --- Revert: close the panel and verify it is removed ---
      61 |     await closeBtn.click()
        at /Users/fleet/fleet-trial/tests/board/toolbar.view_settings.spec.mjs:58:7

    Error Context: test-results/board-toolbar.view_setting-4cab8-n-closing-removes-the-panel/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/board-toolbar.view_setting-4cab8-n-closing-removes-the-panel/trace.zip
    Usage:

        npx playwright show-trace test-results/board-toolbar.view_setting-4cab8-n-closing-removes-the-panel/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    tests/board/toolbar.view_settings.spec.mjs:4:3 › toolbar.view_settings — View settings opens a right-side panel › open panel shows heading, resize handle and close button; closing removes the panel 

----- STDERR (last ~4KB) -----
(node:46169) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:46169) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)


Address the failure directly. If a locator was wrong, pick a different one
from the evidence. If the assertion was too strict, loosen it to match the
observed text/URL. Keep the spec in the same file.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.view_settings",
  "feature": "View settings opens a right-side panel",
  "how_to_verify": "Click 'View settings'. A right sidebar opens with heading 'View settings', a 'Resize sidebar' handle, and a 'Close' button.",
  "notes": "In this space the panel body rendered empty (no controls visible); likely premium-gated or feature-flagged.",
  "status": "partial"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
```json
{
  "id": "toolbar.view_settings",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "A button with accessible name 'View settings' is visible in the board toolbar before click",
    "After clicking 'View settings', the button gains aria-pressed=true (rendered as [active] [pressed] in snapshot)",
    "A complementary region (role=complementary) with accessible name 'Sidebar' appears on the right side of the main area",
    "Inside the sidebar, a heading with level=2 and name 'View settings' is visible",
    "A 'Resize sidebar' button is present inside the sidebar (role=button, name='Resize sidebar')",
    "A 'Close' button is present inside the sidebar header (role=button, name='Close')",
    "Sidebar body contains a group with text 'Hide done work items after:' and a combobox with current value 'Never'",
    "Sidebar body contains a group with accessible name 'Show fields' containing checkboxes: Assignee (checked), Budget, Card cover, Category, Confluence items, Created, Development, Due date (checked), Labels (checked), Linked work items, Priority (checked), Reporter, Resolved, Start date, Status, Sub-task summary (checked), Summary (checked & disabled), Updated, Work item key (checked), Work type (checked)",
    "Clicking the 'Close' button removes the complementary Sidebar region from the DOM (evaluate confirmed 'closed')"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Toolbar 'View settings' toggle button",
        "preferred": "getByRole('button', { name: 'View settings' })",
        "fallback": "locator('button:has-text(\"View settings\")')"
      },
      {
        "purpose": "Right-side View settings panel (complementary region)",
        "preferred": "getByRole('complementary', { name: 'Sidebar' })",
        "fallback": "locator('[role=\"complementary\"][aria-label=\"Sidebar\"]')"
      },
      {
        "purpose": "View settings panel heading",
        "preferred": "getByRole('heading', { level: 2, name: 'View settings' })",
        "fallback": "getByText('View settings', { exact: true })"
      },
      {
        "purpose": "Resize sidebar handle inside the panel",
        "preferred": "getByRole('complementary', { name: 'Sidebar' }).getByRole('button', { name: 'Resize sidebar' })",
        "fallback": "getByRole('button', { name: 'Resize sidebar' })"
      },
      {
        "purpose": "Close button inside the panel header",
        "preferred": "getByRole('complementary', { name: 'Sidebar' }).getByRole('button', { name: 'Close' })",
        "fallback": "getByRole('button', { name: 'Close' })"
      },
      {
        "purpose": "Show fields group inside the panel",
        "preferred": "getByRole('group', { name: 'Show fields' })",
        "fallback": "getByText('Show fields', { exact: true })"
      },
      {
        "purpose": "Summary checkbox (always-on, disabled) — evidence panel is populated",
        "preferred": "getByRole('checkbox', { name: 'Summary' })",
        "fallback": "locator('input[type=\"checkbox\"][aria-label=\"Summary\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "await page.getByRole('button', { name: 'View settings' }).click();",
      "await expect(page.getByRole('complementary', { name: 'Sidebar' })).toBeVisible();",
      "await expect(page.getByRole('heading', { level: 2, name: 'View settings' })).toBeVisible();",
      "await expect(page.getByRole('button', { name: 'Resize sidebar' })).toBeVisible();",
      "await page.getByRole('complementary', { name: 'Sidebar' }).getByRole('button', { name: 'Close' }).click();",
      "await expect(page.getByRole('complementary', { name: 'Sidebar' })).toHaveCount(0);"
    ],
    "mutation_and_revert": null
  },
  "notes": "The original feature note claimed the panel body rendered empty, but in this session the body was populated with a 'Hide done work items after:' combobox (value 'Never') and a 'Show fields' group of ~20 field checkboxes. All three required sub-claims (heading 'View settings', 'Resize sidebar' handle, 'Close' button) were observed, and Close demonstrably hides the sidebar. Consider scoping the Close locator under the complementary region to avoid collisions with other 'Close' buttons elsewhere on the page.",
  "turns": 7,
  "stopped_for_budget": false
}
```

Requirements:
  - File to write: tests/board/toolbar.view_settings.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The fix replaces the broken `toHaveValue('Never')` (which targeted the React Select's hidden dummy `<input value="">`) with two text-visibility checks: one for the label `'Hide done work items after:'` and one for the displayed option `'Never'` — both rendered as visible text nodes in the sidebar's single-value span, which Playwright can reliably find with `getByText`.

## Runner

- exit code: 0
- assertions counted: 13
- passed: true
