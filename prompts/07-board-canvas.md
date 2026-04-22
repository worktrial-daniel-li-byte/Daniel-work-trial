# 07 — Board canvas (columns and cards)

Align the kanban board columns, column headers, and cards to match real
Jira's board markup.

Surface id: `board-canvas`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `<div className="jira-board-canvas">`
→ `<div className="jira-columns">` → per-column JSX, currently around
lines 396–458.

## Reference structure

```startLine:endLine:reference.html
<div data-testid="board.content.board-wrapper"
     data-auto-scrollable="true"
     class="_zulputpp _yyhykb7n _1ii7kb7n _vchhusvi _1bsb1osq _4t3i1osq _7ccakre2 _1reo1wug _1tkeidpf _1ul9idpf _kqswh2mm _syazi7uo _bozg1ejb _y4ti1ejb _1q51pxbi _85i51ejb _1e0c11p5 _yv0e1gqb">

  <!-- repeated per column (To Do, In Progress, Done) -->
  <div data-testid="board.content.cell"
       class="_v5641czr _2rkopb1k _1e0c11p5 _2z0514iv _1lmc1mas _c71l1osq _vchhusvi _1bsbgc50 _kqswh2mm _12ji3acm _1cwgidpf _1qu2nqa1 _12y3yh40 _bfhk1jc5">
    <div data-testid="board.content.cell.column-header" draggable="true"
         class="_nd5lyhso _zulp1b66 _1e0c1txw _4cvr1h6o _kqswh2mm _uiztglyw _59hlidpf _3bdqt94y _at5wt94y _bozgutpp _y4tiu2gc _1q51u2gc _85i5u2gc _bfhk1r5y _1s1g12b0 _5fbc12b0 _16qsina5 _1ul9idpf _1xn7grho _tdle1wug _1d8n1wug _80om1qgj">
      <div data-testid="board.content.cell.column-header.name" role="heading" aria-level="3"
           class="_zulp1b66 _1reo15vq _18m915vq _11c81qyo _1e0c1ule _1ul9idpf _1tkeidpf _1bto1l2s _o5721q9c _syazazsu _k48p1wq8">
        To Do
      </div>
      <!-- Edit status button, Create work item button -->
    </div>
    <div data-testid="board.content.cell.scroll-container"
         data-vc="business-board-cards-container"
         role="list"
         data-auto-scrollable="true"
         class="_nd5l1edp _zulp1b66 _1tkeidpf _1e0c1txw _2lx21bp4 _1reo15vq _18m91wug _y4ti1b66 _bozg1b66 …">
      <!-- cards -->
      <div data-testid="board.content.cell.card"
           data-vc="business-board-card"
           class="_2rko1mok _v5641hrg _p12f1ogy _uiztglyw _vchhusvi _kqswh2mm _1e0c11p5 _16qst7xp _bfhkhp5a _85i51b66 _syazi7uo _tzy4kb7n _lcxvglyw _hv3wt94y _15jnt94y">…</div>
    </div>
  </div>
</div>
```

## Must-preserve contract

- One `[data-testid="board.content.board-wrapper"]`, a `<div>` with
  `data-auto-scrollable="true"`, directly inside `[data-testid="page-layout.main"]`.
- Exactly **three** `[data-testid="board.content.cell"]` children inside
  the board-wrapper (To Do / In Progress / Done).
- Each cell contains, in order:
  1. `[data-testid="board.content.cell.column-header"]` with
     `draggable="true"`. Inside it:
     - `[data-testid="board.content.cell.column-header.name"]` with
       `role="heading"`, `aria-level="3"`, and column title text.
     - A button with `aria-label` starting with `Edit` and ending with
       `status column, edit` (Jira emits e.g.
       `Edit To Do status column, edit`).
  2. `[data-testid="board.content.cell.scroll-container"]` with
     `data-vc="business-board-cards-container"`, `role="list"`, and
     `data-auto-scrollable="true"`.
     - Zero or more `[data-testid="board.content.cell.card"]` children
       (each a `<div>` with `data-vc="business-board-card"`).
- At least one column must contain a button with `aria-label` matching
  the pattern `^Create work item after work item `.

## Class tokens required

Minimum required tokens to assert:

- Wrapper: `_zulputpp _yyhykb7n _1ii7kb7n _vchhusvi _1bsb1osq _4t3i1osq _7ccakre2 _1reo1wug _1tkeidpf _1ul9idpf _kqswh2mm _syazi7uo _bozg1ejb _y4ti1ejb _1q51pxbi _85i51ejb _1e0c11p5 _yv0e1gqb`.
- Cell: `_v5641czr _2rkopb1k _1e0c11p5 _2z0514iv _1lmc1mas _c71l1osq _vchhusvi _1bsbgc50 _kqswh2mm _12ji3acm _1cwgidpf _1qu2nqa1 _12y3yh40 _bfhk1jc5`.
- Column header: `_nd5lyhso _zulp1b66 _1e0c1txw _4cvr1h6o _kqswh2mm _uiztglyw _59hlidpf _3bdqt94y _at5wt94y _bozgutpp _y4tiu2gc _1q51u2gc _85i5u2gc _bfhk1r5y _1s1g12b0 _5fbc12b0 _16qsina5 _1ul9idpf _1xn7grho _tdle1wug _1d8n1wug _80om1qgj`.
- Column header name: `_zulp1b66 _1reo15vq _18m915vq _11c81qyo _1e0c1ule _1ul9idpf _1tkeidpf _1bto1l2s _o5721q9c _syazazsu _k48p1wq8`.
- Scroll container: `_nd5l1edp _zulp1b66 _1tkeidpf _1e0c1txw _2lx21bp4 _1reo15vq _18m91wug _y4ti1b66 _bozg1b66`.
- Card: `_2rko1mok _v5641hrg _p12f1ogy _uiztglyw _vchhusvi _kqswh2mm _1e0c11p5 _16qst7xp _bfhkhp5a _85i51b66 _syazi7uo _tzy4kb7n _lcxvglyw _hv3wt94y _15jnt94y`.

## Behavior to preserve

- `onDragStart` / `onDragOver` / `onDrop` handlers on cards and columns
  MUST survive. The `draggable="true"` attribute on the column header is
  a reference contract; this is separate from the card drag behavior the
  clone already implements on `<article draggable>`.
- Cards in the clone are currently `<article>`. The reference uses
  `<div data-testid="board.content.cell.card">`. Change the tag to
  `<div>` and reattach all existing handlers on that `<div>`.
- `openCreateCard`, `openEditCard`, `deleteCard`, `moveCard` must continue
  to work.

## Ignore list

- The inner decorative spans, SVGs, issue-type icons, and priority markers
  on each card — not part of the structural check.
- Optional trailing tokens on the scroll-container class list (the check
  uses a minimum subset).

## Verification

- Inside `[data-testid="page-layout.main"]`, exactly one
  `[data-testid="board.content.board-wrapper"]` exists.
- That wrapper has exactly **3** direct `[data-testid="board.content.cell"]` children.
- Each cell contains `[data-testid="board.content.cell.column-header"][draggable="true"]`, within which `[data-testid="board.content.cell.column-header.name"][role="heading"][aria-level="3"]` exists with non-empty text.
- Each cell contains `[data-testid="board.content.cell.scroll-container"][role="list"][data-vc="business-board-cards-container"][data-auto-scrollable="true"]`.
- All `[data-testid="board.content.cell.card"]` nodes are `<div>`s with `data-vc="business-board-card"` and every required card class token.
- At least one button inside the board-wrapper has `aria-label` matching `^Create work item after work item `.
- Every column header has a button with `aria-label` matching `^Edit .+ status column, edit$`.
