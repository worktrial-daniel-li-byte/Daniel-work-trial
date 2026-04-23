# Dispatch 09 — resumed worker
- **Target spec:**  `board/toolbar.view_settings.spec.mjs`
- **Focused rerun:** 0/1 passed (1 failed)
- **Improved:** false
- **Worker context next dispatch:** preserved
## Task
The focused rerun still fails with `TimeoutError: locator.click: Timeout 15000ms exceeded.` Your previous pass thought everything was in place, but Playwright is timing out on an early locator.click in tests/board/toolbar.view_settings.spec.mjs. This usually means the locator does match an element, but the element is hidden, off-screen, covered by another element, or has `pointer-events: none`.

Action:
  1. Re-read tests/board/toolbar.view_settings.spec.mjs. Identify the VERY FIRST `.click()` call in the spec (or the first locator it interacts with). Print out what role/name/testid/text it uses.
  2. Open src/App.tsx and find that exact element. Check:
       - Is it inside a hidden/collapsed container (e.g., `display:none`, `visibility:hidden`, or an overflow scroll that hides it)?
       - Is there a DUPLICATE element with the same role+name elsewhere in the DOM? `getByRole('button', { name: 'View settings' })` would fail with a strict-mode violation if multiple exist — which also surfaces as a click timeout-ish error in some Playwright versions.
       - Is a modal/overlay/backdrop intercepting pointer events?
  3. Fix the minimal root cause:
       - If duplicate: give the toolbar one a unique aria-label (e.g., add the exact `aria-label="View settings"` only on the toolbar button; rename any other "View settings" label to something else).
       - If hidden by CSS: make sure the toolbar button is visible. Check src/App.css for `.board-toolbar` / `.jira-toolbar` overflow rules hiding the button.
       - If intercepted: ensure no invisible overlay div is above the toolbar.
  4. Also: the spec may click something INSIDE the panel first (e.g., expects the panel to start CLOSED, then opens by clicking View settings). Make sure the panel is NOT rendered by default — only after clicking.

Report which case applied and what you changed. PREFER attribute/text/aria-label changes over CSS/JSX restructuring.
## Rationale
Click is timing out — likely the view-settings button exists but isn't visible/clickable (off-screen, covered, or the locator resolves to a different element). Need to actually run the spec logic and debug what the first click target is.
## Worker summary
The fix is in place. The root cause was the invisible overlay `<button>` in the project-name section that had `position:absolute; inset:0; pointer-events:auto` — without any positioned ancestor between it and `.jira-app` (which has `position:relative`), it expanded to cover the entire application, intercepting every toolbar click. Adding `style={{position:'relative'}}` to the wrapping `<div>` around that form constrains the overlay to just the project-name area, unblocking the "View settings" button and all other toolbar buttons.