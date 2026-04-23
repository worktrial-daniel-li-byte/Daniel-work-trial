# Feature card.edit_summary — mutation attempt 01
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/card.edit_summary.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "card.edit_summary",
  "feature": "Inline 'Edit summary' pencil per card opens an in-card editor",
  "how_to_verify": "Click 'Edit summary'. The summary renders as a focused role=textbox name='Work item summary' with current value prefilled, accompanied by role=button 'Submit' (✓) and role=button 'Cancel' (X). Escape cancels and preserves the original text.",
  "action_is_mutating": true,
  "notes": "Full edit-and-submit via automation was not completed: the textarea ref goes stale on every external action (live presence indicator re-renders the card), blocking browser_fill/browser_type. Manual keystrokes succeed but are flaky. Escape-to-cancel verified; original summary preserved.",
  "status": "partial"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "card.edit_summary",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "page.url() === 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'",
    "Page title is 'Board - Autoloop - Jira'",
    "role=heading level=3 name='To Do' is visible with count '1' beside it",
    "role=heading level=3 name='In Progress' is visible with count '0'",
    "role=heading level=3 name='Done' is visible with count '0'",
    "A link with accessible name 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.' and href '/browse/AUT-1' exists in the To Do column",
    "Before clicking: a role=button with accessible name 'Edit summary' is present inside the AUT-1 card",
    "After clicking 'Edit summary': the static summary text is replaced by role=textbox with accessible name 'Work item summary', and the textbox is focused (marked [active] in snapshot)",
    "The textbox value is pre-filled with the current summary 'Design autonomous replanning loop'",
    "Accompanying role=button name='Submit' appears next to the textbox",
    "Accompanying role=button name='Cancel' appears next to the textbox",
    "A visible label 'Work item summary' precedes the textbox",
    "After pressing Escape: the textbox, Submit, and Cancel buttons are removed from the DOM and the card returns to its read-only state",
    "After pressing Escape: the card summary text is preserved as 'Design autonomous replanning loop' (unchanged)",
    "After pressing Escape: the 'Edit summary' button is available again (tooltip 'Edit summary' visible on hover)"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "AUT-1 card link anchor (entry point to locate the card)",
        "preferred": "getByRole('link', { name: /^AUT-1 Design autonomous replanning loop/ })",
        "fallback": "locator('a[href=\"/browse/AUT-1\"]')"
      },
      {
        "purpose": "Inline 'Edit summary' pencil button on the AUT-1 card",
        "preferred": "getByRole('button', { name: 'Edit summary' })",
        "fallback": "getByText('Edit summary')"
      },
      {
        "purpose": "In-card summary editor textbox (opened after clicking Edit summary)",
        "preferred": "getByRole('textbox', { name: 'Work item summary' })",
        "fallback": "locator('textarea[aria-label=\"Work item summary\"]')"
      },
      {
        "purpose": "Submit (✓) button within the in-card editor",
        "preferred": "getByRole('button', { name: 'Submit' })",
        "fallback": "locator('button[aria-label=\"Submit\"]')"
      },
      {
        "purpose": "Cancel (X) button within the in-card editor",
        "preferred": "getByRole('button', { name: 'Cancel' })",
        "fallback": "locator('button[aria-label=\"Cancel\"]')"
      },
      {
        "purpose": "To Do column heading (anchor to locate the correct column)",
        "preferred": "getByRole('heading', { level: 3, name: 'To Do' })",
        "fallback": "getByText('To Do', { exact: true })"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": [
      "page.goto('https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status')",
      "await expect(page.getByRole('link', { name: /^AUT-1 Design autonomous replanning loop/ })).toBeVisible()",
      "await page.getByRole('button', { name: 'Edit summary' }).click()",
      "await expect(page.getByRole('textbox', { name: 'Work item summary' })).toBeFocused()",
      "await expect(page.getByRole('textbox', { name: 'Work item summary' })).toHaveValue('Design autonomous replanning loop')",
      "await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()",
      "await page.keyboard.press('Escape')",
      "await expect(page.getByRole('textbox', { name: 'Work item summary' })).toHaveCount(0)",
      "await expect(page.getByRole('link', { name: /^AUT-1 Design autonomous replanning loop/ })).toBeVisible()",
      "await expect(page.getByRole('button', { name: 'Edit summary' })).toBeVisible()"
    ],
    "mutation_and_revert": null
  },
  "notes": "Observed the full editor surface (textbox, Submit, Cancel) appear on click, and confirmed Escape closes the editor while preserving the original summary 'Design autonomous replanning loop'. Per upstream partial note, attempting to programmatically fill the textbox is flaky because a live presence indicator re-renders the card and makes the textarea ref go stale mid-interaction; the spec should therefore verify the cancel/escape path (no mutation) rather than submitting a new value. mutation_and_revert intentionally null — the feature's non-mutating surface is fully verifiable and the task description labels this check as 'partial' on the mutating half.",
  "turns": 8,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/card.edit_summary.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
Based on my thorough analysis of the source code, I can confirm the following:

1. **The inline "Edit summary" in-card editor is not implemented in `src/App.tsx`.** The only occurrence of "Edit summary" in the source is `<span className="vh-sr">Edit summary</span>` inside `jira-card__open` — a button that calls `onOpenCard()` and opens a modal dialog, not an inline editor.

2. **No textbox with accessible name `'Work item summary'`** exists anywhere in `src/`. The `CardDetailDialog` title input has no `aria-label` at all, and `editingTitle` starts as `false`, so no input is shown on open.

3. **No in-card Submit/Cancel buttons** for summary editing are implemented anywhere in the board card rendering path.

4. The `INITIAL_COLUMNS` has AUT-1 with title `'This is a test'` (not `'Design autonomous replanning loop'`), and there is no `public/initial-state.json` to override it — so the spec would already fail at assertion 2 when run against the local SPA.

The browser evidence shows the feature working against the **live Jira Cloud instance** (`https://fleet-team-y0ak1u2s.atlassian.net`), which is Jira's native inline summary editor. This feature was never built into `src/`. I cannot make the test fail by editing `src/` or `public/` because:

- If the harness runs against live Jira → my changes have no effect on it.
- If the harness runs against localhost → the test already fails without any sabotage.

**No edits made.** The inline "Edit summary" feature lives entirely behind the external live Jira URL and is not implemented in `src/` at all.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified