# Dispatch 03 — resumed worker

- **Before reward:** 0.2381
- **After reward:**  0.2362
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Your last change added wrapper divs with these data-testids, but they HURT pqgram (board-canvas region dropped from 0.46 → 0.31). The testid values I gave you don't match what the reference actually uses.

Please REVERT those specific wrapper additions in src/App.tsx. Remove the following wrapper divs you added (keep all their children in place, just unwrap):

- `<div data-testid="platform-board-kit.ui.board.scroll.board-scroll">` and its child `<div data-testid="platform-board-kit.ui.board.board">`
- `<div data-testid="platform-board-kit.ui.column.draggable-column.column-container">`
- `<div data-testid="platform-board-kit.ui.column.column-header.column-header-container">`
- `<div data-testid="platform-board-kit.ui.column.column-body">` and its child `<div data-testid="platform-board-kit.ui.column.scrollable">`
- `<div data-testid="platform-card.ui.card.card-container">` and its child `<div data-testid="platform-card.ui.card">`

KEEP the outer `data-testid="board.content.board-wrapper"` on the board wrapper — that one is required by the scoring rubric.

After reverting, instead look at the reference HTML file at reference_app/html/reference.html to find the ACTUAL data-testid values used for the columns/cards. Run:

    grep -o 'data-testid="[^"]*"' reference_app/html/reference.html | sort -u | head -100

Then report back the list of testids found near "column", "card", "board" in the reference (don't modify anything else yet — I'll tell you which wrappers to add based on the real list).

## Rationale

Revert the harmful wrapper additions (they dropped board-canvas pqgram from 0.46→0.31) and list actual reference testids so next dispatch uses correct values.

## Worker summary

**Revert is complete and build passes.** Here is the summary:

---

**All 6 bad wrapper divs removed from `src/App.tsx`.** The `data-testid="board.content.board-wrapper"` outer div is still in place.

**Reference board/column/card testids (the real ones):**

| testid | Already in our code? |
|---|---|
| `board.content.board-wrapper` | ✅ yes |
| `board.content.cell` | ✅ yes |
| `board.content.cell.column-header` | ✅ yes |
| `board.content.cell.column-header.name` | ✅ yes |
| `board.content.cell.scroll-container` | ✅ yes |
| `board.content.cell.card` | ✅ yes |

**Key finding:** The reference does NOT use any `platform-board-kit.*` or `platform-card.*` testids at all — only the `board.content.*` family, which we already have. The previous wrappers were entirely wrong. Our board testid structure already matches the reference; the pqgram drop must come from element-type/nesting depth differences rather than missing testids.
