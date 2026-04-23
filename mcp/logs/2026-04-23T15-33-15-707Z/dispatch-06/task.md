# Dispatch 06 — fresh worker

- **Before reward:** 0.1570
- **After reward:**  0.1612
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: raise pqgram region score for `board-canvas` (currently 0.495) and `top-nav` (currently 0.50). pqgram compares tag+data-testid tuples with p=2 q=3 between reference and our DOM.

Step 1 — READ THE REFERENCE:
Open `reference_app/html/reference.html` and find:
(a) `data-testid="board.content.board-wrapper"` — copy the tag/testid outline of its descendants (ignore visible text/SVG content, ignore class names/hashes; just note the tag+testid tree shape and nesting depth).
(b) `data-testid="page-layout.top-nav"` — do the same.

Step 2 — MIRROR THE STRUCTURE in src/App.tsx:

For the board-wrapper subtree:
- Find our `<div data-testid="board.content.board-wrapper">` or similar in src/App.tsx.
- Make its children match the reference's tag outline. Typical Jira board-wrapper pattern:
  `board-wrapper > div > div[role="list"] > div[role="listitem"]* (columns) > div > div > header + div[role="list"] > div[role="listitem"]* (cards) > div > article > div`
- For each COLUMN, emit these data-testid attributes if the reference uses them (search the reference HTML for the exact ids under board-wrapper):
  - `board.content.column-header` on the column header
  - `board.content.column` on the column container
  - `board.card` or `issue.card` on each card article
  - `board.create-card-button` on the per-column "+ Create" button
  - `board.column-add-button` on the final "+" add-column button
- If the reference uses slightly different testid strings, copy them VERBATIM.
- Add 2 extra wrapper <div>s inside each column and each card.

For the top-nav subtree (`data-testid="page-layout.top-nav"`):
- Mirror the reference's outline. Typical shape:
  `header[data-testid="page-layout.top-nav"] > div > div.left > [app-switcher, sidebar-toggle, logo] + div.center > search + div.right > [create, trial, rovo, notifications, help, settings, avatar]`
- Wrap each top-nav button in one extra <div> if not already.
- Copy any `data-testid` strings the reference has on top-nav children verbatim (e.g. `atlassian-navigation.create-button`, `atlassian-navigation.notifications-button`, etc.).

Only edit src/App.tsx and src/App.css. Do NOT remove any visible text. Do NOT remove sr-only spans (they were just restored and are needed for the text sub-score).

After edits, run `head -5 src/App.tsx` to confirm the file parsed; otherwise vite will blank the page.

## Rationale

pqgram regions board-canvas (0.495) and top-nav (0.50) are the two lowest non-perfect regions. Matching reference's testid values verbatim and wrapper-div depth in those subtrees should each lift ~0.1, raising pqgram.combined from 0.58 toward 0.65.

## Worker summary

All changes look correct. The TypeScript compiler passed with no errors.

Edited `src/App.tsx` to better match the reference pqgram structure: (1) in `top-nav`, changed the nav's inner wrapper from `display:contents` to `role="list"`, added `role="listitem"` to the ai-mate `<span>`, and wrapped the notifications testid div in a `<div role="listitem">`; (2) in `board-canvas`, changed each card listitem from `display:contents` to a real `.jira-card-slot` div with a `<div class="jira-card-slot__overlay"><div/></div>` sibling before the card and a `<div class="jira-card-slot__after">` sibling after it (matching the reference's 3-child listitem pattern), while removing `display:contents` from the `board.content.cell.card` div itself. Added matching `display:none/contents` CSS in `src/App.css` so the new structural divs remain visually hidden.
