# Dispatch 03 — resumed worker

- **Before reward:** -0.0527
- **After reward:**  -0.0179
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Last change raised horizontal-nav to 0.48 and project-header to 0.47 — good. Two leftover problems I want you to fix in this dispatch, both in src/App.tsx:

(A) LAYOUT CLEANUP (do this first, it's small):
The project header now wraps: the top-right icon cluster (share, bolt, add-person, maximize) renders BELOW the "Autoloop" title row instead of on the same line at the far right. Also small icons appeared to the right of "Autoloop" that shouldn't be there. Look at the current app screenshot vs reference:
- Reference: a single row — left side has "Spaces" eyebrow + "Autoloop" title + small avatar-group icon + "..." button; right side (same row) has 4 icons: share, lightning, add-person, maximize.
- Current: the eyebrow "Spaces" and "Autoloop" are fine, but the four right-side icons are on their own row below. Also extra stray icons sit next to Autoloop.
Fix the flex layout so the header is a single row with `justify-content: space-between`: left cluster and right cluster on the same row. Remove the duplicate/extra icons next to Autoloop that aren't in the reference (reference only has the little avatar-group "people" icon + "..." menu next to Autoloop).
Preserve all data-testid values. Only fix layout and remove duplicated icon elements.

(B) RAISE pqgram FOR board-canvas (currently 0.34):
- In reference_app/html/reference.html, find `data-testid="board.content.board-wrapper"` and study its subtree: every tag, every data-testid, wrapper-div nesting depth, and notably the per-column / per-card testids (look for things like `software-board.board-container.board.card-container.card-with-icc.card`, `platform-board-kit.ui.column.draggable-column`, `software-board.board-container.board.column-with-limits`, `platform-card.card`, `platform-inline-card-create.ui.form`, etc. — copy exact strings you see).
- In src/App.tsx, locate the kanban board area (the three columns "To Do", "In Progress", "Done" plus the "+" add-column button and the AUT-1 card).
- Set `data-testid="board.content.board-wrapper"` on the board root element (same tag the reference uses).
- For each column and card, emit the reference's data-testid values verbatim on matching tags. Mirror the wrapper-div nesting depth the reference uses around columns / column-header / card-list / card / card-key / create-button.
- Do NOT change any visible text. Keep: "To Do", "1", "In Progress", "0", "Done", "0", "This is a test", "AUT-1", "Create".
- Class names don't matter — only tag + data-testid.

In your summary, list:
1) Whether the project-header is now a single row (and what flex rule you used).
2) Every data-testid you added inside the board-wrapper subtree, with the tag it sits on.

## Rationale

pqgram: board-canvas region is 0.34 — a big remaining gap. Adding the reference's board/column/card data-testid anchors with mirrored wrapper-div depth will raise that region (largest visible subtree) and also push 'whole' up. The layout cleanup protects ssim so reward stops regressing on each pqgram win.

## Worker summary

All the changes are in place. TypeScript is clean. Here's what was changed in `src/App.tsx`:

**Task A (layout cleanup):**
1. Project-header div changed from `display:'contents'` to `display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'` — makes it a real flex row.
2. Col2 outermost div changed from `display:'contents'` to `minWidth:0, flex:'0 1 auto'` — groups the eyebrow+title as a block within the flex row.
3. Removed the duplicate "Give access" button and "Edit, Space name" button (+ Popover) from `jira-title-row`; only the swatch and h1 remain there.
4. Moved the project-actions Popover to col3's `navigation-project-action-menu.ui.themed-button`, with the "..." ellipsis icon.
5. Changed `actions-inner` div from `display:'contents'` to `display:'flex', alignItems:'center', gap:'4px', marginLeft:'auto', flexShrink:0` — pushes the 4 right icons (share/automation/feedback/fullscreen) to the far right.

**Task B (board pqgram):**
- `board.content.board-wrapper`: structure mirrors reference — per-column `display:contents` wrappers at D02, `board.content.cell` at D03.
- `board.content.cell.column-header` (D04): added `role="presentation"` to the form (D07), added two more wrapper divs (D08–D11 with D10 `role="presentation"`) to push `column-header.name` from D08 to D12; added `role="heading"` on `column-header.name`.
- `board.content.cell.scroll-container`: added `role="list"`.
- Each card: wrapped in `div[role=listitem]` at D05, `board.content.cell.card` at D06 — removed the old hidden-button sibling fragment.
- Create button moved out of scroll-container into its own `display:contents` sibling div of the column.
- Add-column button wrapped in `div[role=presentation, display:contents]` as the last child of `jira-columns`.
