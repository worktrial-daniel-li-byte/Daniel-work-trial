# Dispatch 17 — fresh worker

- **Before reward:** 0.3941
- **After reward:**  0.3957
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Investigative + fix task.

## Step 1: Diagnose why pqgram region `board-canvas` is stuck at 0.49

The board-canvas region is anchored at `data-testid="board.content.board-wrapper"`. The reference's structure includes these KEY data-testid values inside that wrapper:
- `board.content.cell` (on each column outer div)
- `board.content.cell.column-header` (on each column header div)
- `board.content.cell.column-header.name` (on the column name text div)
- `board.content.cell.scroll-container` (on the cards list)
- `board.content.cell.card` (on each card div)

Run this check:
    grep -c 'board.content.board-wrapper' src/App.tsx
    grep -c 'board.content.cell"' src/App.tsx
    grep -c 'board.content.cell.column-header"' src/App.tsx
    grep -c 'board.content.cell.column-header.name' src/App.tsx
    grep -c 'board.content.cell.scroll-container' src/App.tsx
    grep -c 'board.content.cell.card' src/App.tsx

Report the counts. If any are 0, the previous restructure lost them — reinsert them on the correct elements.

Also count:
    grep -c 'business-board-column' src/App.tsx
    grep -c 'business-board-card' src/App.tsx

## Step 2: If any testids are missing, add them back

For each missing testid from the reference list above, add `data-testid="..."` to the appropriate wrapper element. Reference structure:

    <div data-vc="business-board-column">
      <div data-testid="board.content.cell">
        <div data-testid="board.content.cell.column-header" draggable={true}>
          ...
          <div data-testid="board.content.cell.column-header.name" role="heading" aria-level={3}>
            {columnName}
          </div>
          ...
        </div>
        <div data-testid="board.content.cell.scroll-container" role="list">
          <div role="listitem">
            <div data-testid="board.content.cell.card" data-vc="business-board-card">
              ...
            </div>
          </div>
        </div>
        ...
      </div>
    </div>

All six testid strings above must be present in src/App.tsx (each appearing at least once, some 3 times for the 3 columns). Fix any that are missing.

## Step 3: Also restore the small visible icons that disappeared

In src/App.tsx, locate the project-header action buttons (team-button-trigger, navigation-project-action-menu.ui.themed-button, share-button, automation-menu-button) and ensure each button's inner `<span role="img">` contains a simple visible inline SVG. Currently they may be empty, causing the project-header row to look odd. Use these SVG bodies (16×16, fill="#42526E"):

- team-button-trigger (people icon): `<circle cx="6" cy="5" r="2.5"/><circle cx="11" cy="6" r="2"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4v1H2z"/><path d="M9 14c0-1 .3-1.9.8-2.7C11.3 11.5 13 12.3 13 14v0z"/>`
- action-menu (three dots): `<circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/>`
- share: `<path d="M12 2l-3 3h2v5h2V5h2zM4 8v6h10v-6h-2v4H6V8z"/>`
- automation (lightning): `<path d="M9 1L3 9h3l-1 6 7-9H9z"/>`

Additionally, the assignee-filter fieldset seems to have lost its visible DL avatar. Add a visible span with text "DL" inside the `presence-filter-avatar` div — the existing `div` innermost leaf should show "DL" styled as a green circle. Use:
`<div style={{width:24,height:24,borderRadius:'50%',background:'#1F845A',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600}}>DL</div>`

Also: the Filter button has lost its down-chevron. Inside the second `<span>` right after the "Filter" text span, add: `<span><svg width="10" height="10" viewBox="0 0 10 10" fill="#42526E"><path d="M1 3l4 4 4-4z"/></svg></span>`

Report findings from step 1 and what you fixed in steps 2 and 3.

## Rationale

board-canvas pqgram stuck at 0.49 — likely missing data-testids. Diagnosing then re-adding them should push it up. Additionally restoring visible SVG icons in header should recover ssim (0.80 → 0.81+).

## Worker summary

All changes verified. Here's a summary of what was done in `src/App.tsx`:

**Step 1 findings**: All 6 `board.content.*` testids were present but `business-board-column` and `business-board-card` (the `data-vc` attributes) were both at 0 — those were the missing structural identifiers.

**Step 2**: Added `data-vc="business-board-column"` to the outer column wrapper div, `draggable={true}` to the `board.content.cell.column-header` div, and `data-vc="business-board-card"` to the card div.

**Step 3**: Replaced all four header button SVGs (team/action-menu/share/automation) with the specified 16×16 `fill="#42526E"` inline SVGs and changed the team-button's span from `aria-hidden` to `role="img"`; added the down-chevron SVG inside the Filter button's trailing `<span>`; and switched the DL avatar from a CSS class to an inline-styled green circle div.
