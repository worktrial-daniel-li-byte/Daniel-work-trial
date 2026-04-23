# Dispatch 04 — fresh worker

- **Before reward:** -0.1261
- **After reward:**  -0.1176
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Edit src/App.tsx and src/App.css to fix the BOARD COLUMNS so they auto-fit their content (not stretch to full page height) and the "+ Create" row moves position.

Current behavior: the three columns (To Do, In Progress, Done) each stretch vertically to fill the viewport, and "+ Create" sits at the column's very bottom edge.

Desired behavior (matching the reference):
- Each column's body should be SHORT — only as tall as needed to contain its cards plus ONE "+ Create" row directly under the header.
- For EMPTY columns (In Progress 0, Done 0): immediately under the purple header show the "+ Create" row, then nothing else. The column should visually end ~60px below the header.
- For NON-empty columns (To Do 1): show the header, then each card stacked, then at the BOTTOM (below the last card) a "+ Create" row. No extra empty space under it.
- The column background should be a light purple tint (keep current) but the column height should be `height: fit-content` / `align-self: flex-start` so columns don't stretch.

In the CSS (src/App.css):
- Find the `.jira-column` or equivalent wrapper class and set `align-self: flex-start;` and remove any `min-height: 100%` / `flex: 1` rules on the column body.
- Find the `.jira-column__body` or equivalent and remove `flex: 1 1 auto` if present, make it simply `display: flex; flex-direction: column;` with `gap: 8px;` and padding `8px`.
- The "+ Create" row itself should be a small button-like row (36px tall, muted text #6b778c, "+" icon). When it's in an empty column, no separator above; when cards precede it, same styling — consistent.

In the JSX (src/App.tsx):
- If the existing structure renders cards inside a flex-growing container and the "+ Create" row separately at the bottom, refactor to put the "+ Create" row INSIDE the same cards container so it sits right after the cards (empty or not). This ensures the column naturally shrinks to fit content.

Also: the small square "+" button to the right of Done (for adding a new column) should NOT stretch — it should be ~44x44 aligned to the top, next to the Done column's header.

After this change the reference-like layout should have columns that are ~120px tall for empty ones and only as tall as their cards for populated ones.

## Rationale

The empty columns stretch way too tall and Create is at the bottom; fixing to fit-content with Create right under header will dramatically improve ssim (visual structure mismatch is huge right now).

## Worker summary

Summary: Edited `src/App.css` to make `.jira-col` use `align-self: flex-start` with `height: fit-content` (and switched `.jira-columns` to `align-items: flex-start`), removed `flex: 1` / `min-height` from `.jira-col__cards`, restyled `.jira-col__create` to a 36px row with muted `#6b778c` text, and resized `.jira-col-add` to 44×44 with `align-self: flex-start` so it doesn't stretch. Edited `src/App.tsx` (BoardView) to move the "+ Create" button inside the `.jira-col__cards` container so it sits directly after the cards (or alone beneath the header when the column is empty), letting the column shrink to fit its content.
