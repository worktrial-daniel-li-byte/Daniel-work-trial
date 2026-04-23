# Dispatch 08 — fresh worker

- **Before reward:** -0.0456
- **After reward:**  -0.0369
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Edit src/App.css to make three specific fixes:

1. SIDEBAR WIDTH: the sidebar currently is 256px wide. Change it to 310px wide. Find the `.jira-sidebar` class (or whatever the left nav container class is) and update its `width` / `flex-basis` to `310px`. Also update any corresponding margin/padding on the main content area so it starts after 310px instead of 256px. If you can't find the exact width, grep for `256` in src/App.css and change those to `310`.

2. TOPBAR BACKGROUND: the top bar (containing search, Create, Premium trial, Ask Rovo, etc.) currently has a WHITE background. It needs to be the SAME light purple as the sidebar/page background. Find the `.jira-topbar` class and set `background: var(--jira-board-bg);` or the same color used for `.jira-sidebar` background. Confirm there is NO `border-bottom` on the topbar. If you see an explicit `background: #ffffff` or `background: white` on `.jira-topbar`, replace it with the purple tint.

3. BOARD CONTENT PADDING/MARGIN: currently the board content area may have a white or mismatched background. Make sure the content area (the div wrapping the Autoloop title, tabs, and columns) uses the same purple background. Grep for `background: white` or `background: #fff` / `#ffffff` in src/App.css — if any remain on non-card/non-input elements, change them to `var(--jira-board-bg)` or the matching purple tint.

After these changes: the entire viewport should show a continuous light purple background from top-left to bottom-right, broken only by white task cards and the white search input.

## Rationale

Sidebar width and topbar bg are persistent visual mismatches. Widening sidebar to 310px should align layout with ref significantly (ssim up), and purple topbar should boost color.

## Worker summary

Edited src/App.css: changed `.jira-sidebar` width from 256px to 310px. The topbar (#2) already had `background: var(--jira-board-bg)` with no border-bottom, and the board content area (`.jira-workspace`, `.jira-project-top`, `.jira-board-canvas`) was already using the purple board background — no white/#fff backgrounds remained on wrapper elements (only on cards, inputs, modals, and summary panels, which should stay white).
