# Dispatch 21 — resumed worker

- **Before reward:** 0.4374
- **After reward:**  0.4382
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Focused structural fix for the board-canvas region (pqgram stuck at 0.49). The reference's card internal structure is deeper than ours.

In src/App.tsx, find the card JSX inside the board. It currently has a structure like `<div data-testid="board.content.cell.card" data-vc="business-board-card">` containing:
- `<a>` link
- summary `<div>` with title text
- metadata `<div>` with icons

The reference's exact card internal structure is:

    <div data-testid="board.content.cell.card" data-vc="business-board-card">
      <a draggable="true" href="/browse/AUT-1"></a>
      <div> {/* summary row */}
        <span>
          <span>
            <span>
              <div role="presentation">
                <button type="button">
                  <span>
                    <span aria-hidden="true">{/* edit icon */}</span>
                    <span className="vh-sr">Edit summary</span>
                  </span>
                </button>
              </div>
              This is a test
            </span>
          </span>
        </span>
        <div> {/* card actions */}
          <button type="button">
            <span>
              <span aria-hidden="true">{/* more icon */}</span>
              <span className="vh-sr">Card actions on Task AUT-1 of the To Do column</span>
            </span>
          </button>
        </div>
      </div>
      <div> {/* metadata row */}
        <div> {/* issue type */}
          <div role="presentation">
            <img alt="Task" src={/* a small task icon */} width="16" height="16" />
          </div>
        </div>
        <div>AUT-1</div>
        <div role="presentation"> {/* priority */}
          <button aria-label="Priority: Medium" aria-haspopup="true">
            <img alt="Priority: Medium" src={/* priority icon */} width="12" height="12" />
          </button>
        </div>
        <div role="presentation"> {/* assignee */}
          <div>
            <div>
              <button aria-label="Assignee: None" aria-haspopup="true">
                <span>
                  <span aria-hidden="true">{/* avatar svg */}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

Critical points:
1. The card title ("This is a test") is a TEXT NODE inside 3 nested `<span>` elements (span > span > span > TEXT) AFTER the edit-summary button div.
2. The issue-type icon is an `<img>` inside `<div><div role="presentation"><img /></div></div>`.
3. The priority is an `<img>` inside `<button><img /></button>`.
4. The assignee button has `<span><span aria-hidden="true">...</span></span>` inside.

Use tiny placeholder SVG data URIs for the img src attributes like:
    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%231868DB'><rect width='16' height='16' rx='2'/></svg>"

Restructure the existing card in src/App.tsx to match this exact nesting. Keep existing classNames where possible (apply them to the outermost wrapper), but the INNER structure must follow the tag tree above. Keep all existing text (title, AUT-1, Create) visible.

Run `npm run build` and report what you changed.

## Rationale

board-canvas pqgram stuck at 0.49; if I match the reference's deep card internal nesting (span > span > span > text, img-based icons, nested button structures), this region could jump significantly. board-canvas is weighted 1/9 of pqgram = small but nonzero; if it goes 0.49 → 0.75 that's +0.006 reward at least.

## Worker summary

Build passes cleanly. Here's what I changed in `src/App.tsx`:

1. **Card structure (main task)**: Replaced the `<article>`-based card JSX inside `<div data-testid="board.content.cell.card">` with the reference's exact nesting — added `data-vc="business-board-card"`, moved drag handlers to the outer div, made the `<a>` empty+draggable, wrapped the card title in 3 nested `<span>` elements with the edit-summary button in a `<div role="presentation">` before the text node, moved the more-actions button into a sibling `<div>` inside the summary row, restructured issue-type as `<div><div role="presentation"><img/></div></div>`, priority as `<div role="presentation"><button aria-haspopup><img/></button></div>`, and assignee as `<div role="presentation"><div><div><button aria-haspopup><span><span aria-hidden>...</span></span></button></div></div></div>`.

2. **Pre-existing build errors fixed**: Removed unused `Fragment` import, suppressed unused `unreadCount`/`_resetBoard`/`_exportBoard` with `void`, and added `?? ''` to three `select value` props to fix `string | null` type errors.
