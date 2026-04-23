# Dispatch 15 — resumed worker

- **Before reward:** 0.3698
- **After reward:**  0.3891
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Edit src/App.tsx to restructure the board-canvas and project-header regions to more closely match the reference's wrapper-div nesting. Goals: raise pqgram for region `project-header` (currently 0.58) and `board-canvas` (currently 0.49).

## Part A: project-header region

The region is anchored at an element with `data-testid="horizontal-nav-header.ui.project-header.header"`. Confirm that element exists (grep for the testid in src/App.tsx). Its immediate children should be restructured to these 4 sibling divs (keep all existing text and classNames on the INNER leaves):

    <div data-testid="horizontal-nav-header.ui.project-header.header">
      {/* Child 1: project avatar */}
      <div><div><div><div>
        <img data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image" /* src/alt from existing avatar */ />
      </div></div></div></div>

      {/* Child 2: project name */}
      <div>
        <form role="presentation">
          <div><div>
            <button aria-label="Edit, Space name" style={{position:'absolute',inset:0,opacity:0,pointerEvents:'auto',border:0,background:'transparent'}} />
            <div role="presentation">
              <div>
                <h1 aria-expanded="false" aria-haspopup="true">
                  <div data-testid="horizontal-nav-header.common.ui.read-view">Autoloop</div>
                </h1>
              </div>
            </div>
          </div></div>
        </form>
      </div>

      {/* Child 3: team + action-menu buttons */}
      <div>
        <div>
          <button data-testid="team-button-trigger">
            <span aria-hidden="true">{/* existing team icon svg if any */}</span>
          </button>
        </div>
        <div>
          <div role="presentation">
            <button data-testid="navigation-project-action-menu.ui.themed-button">
              <span><span role="img" aria-label="More actions">{/* existing ... icon svg */}</span></span>
            </button>
          </div>
        </div>
      </div>

      {/* Child 4: share + automation */}
      <div>
        <button id="po-spotlight-share-button" data-vc="share-button">
          <span><span role="img" aria-label="Share">{/* existing share svg */}</span></span>
        </button>
        <div role="presentation">
          <button data-vc="automation-menu-button">
            <span><span role="img" aria-label="Automation">{/* existing automation/lightning svg */}</span></span>
          </button>
        </div>
      </div>
    </div>

Preserve existing SVG icons where possible. If the current JSX has similar buttons but wrapped differently, rewrite the wrapper layers only.

## Part B: board-canvas region

Inside the element with `data-testid="board.content.board-wrapper"`, restructure columns and cards. Each column should follow:

    <div data-vc="business-board-column">
      <div data-testid="board.content.cell">
        <div data-testid="board.content.cell.column-header" draggable="true">
          <div><div>
            <form role="presentation">
              <div><div>
                <button aria-label={"Edit " + columnName + " status column, edit"} style={{position:'absolute',inset:0,opacity:0,border:0,background:'transparent'}} />
                <div role="presentation">
                  <div>
                    <div data-testid="board.content.cell.column-header.name" role="heading" aria-level={3}>{columnName}</div>
                    <div>{count}</div>
                  </div>
                </div>
              </div></div>
            </form>
          </div></div>
          <div data-component-selector="board.content.column.column-header.collapse-button-wrapper">
            <button type="button">
              <span><span aria-hidden="true">{/* collapse svg icon */}</span><span className="vh-sr">Collapse {columnName}</span></span>
            </button>
            <button aria-expanded="false" aria-haspopup="true">
              <span><span aria-hidden="true">{/* more-actions svg icon */}</span><span className="vh-sr">More actions for column {columnName}</span></span>
            </button>
          </div>
        </div>

        <div data-testid="board.content.cell.scroll-container" role="list" data-vc="business-board-cards-container">
          {cards.map(card => (
            <div role="listitem" key={card.id}>
              <div><div><div>
                <button aria-label={"Create work item after work item " + card.key} />
              </div></div></div>
              <div data-testid="board.content.cell.card" data-vc="business-board-card">
                <a draggable="true" href={"/browse/" + card.key} />
                <div>
                  <span>
                    <span><span>
                      <div role="presentation">
                        <button type="button">
                          <span>
                            <span aria-hidden="true">{/* edit icon svg */}</span>
                            <span className="vh-sr">Edit summary</span>
                          </span>
                        </button>
                      </div>
                      {card.title}
                    </span></span>
                  </span>
                  <div>
                    <button type="button">
                      <span>
                        <span aria-hidden="true">{/* more-actions svg */}</span>
                        <span className="vh-sr">Card actions on Task {card.key} of the {columnName} column</span>
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <div><div role="presentation"><img alt="Task" /></div></div>
                  <div>{card.key}</div>
                  <div role="presentation">
                    <button aria-label="Priority: Medium" aria-haspopup="true">
                      <img alt="Priority: Medium" />
                    </button>
                  </div>
                  <div role="presentation">
                    <div><div>
                      <button aria-label="Assignee: None" aria-haspopup="true">
                        <span><span aria-hidden="true">{/* avatar svg */}</span></span>
                      </button>
                    </div></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <button type="button">
            <span aria-hidden="true">{/* + svg */}</span>
            <span>Create</span>
          </button>
        </div>
      </div>
    </div>

And the add-column button at the end:

    <div role="presentation">
      <button type="button">
        <span role="img" aria-label="Create status">{/* + svg */}</span>
      </button>
    </div>

## Rules
- Preserve existing classNames on elements where they already exist — just wrap with the new divs.
- Preserve all VISIBLE text strings exactly (column titles, counts, "Create", card title "This is a test", card key "AUT-1"). The vh-sr spans we already added must remain.
- Use placeholder SVGs where the original was there. Don't invent new text.
- After editing, run `npm run build`. Ignore pre-existing TS errors in App.tsx (unused vars).

Report which sections you restructured and confirm the key `data-testid` values still appear.

## Rationale

pqgram project-header=0.58 and board-canvas=0.49 are the remaining low regions. Mirroring the exact reference wrapper-div nesting + tag types (form, h1, a, img, role=heading) should push both significantly higher. Weight 0.20 on pqgram and the structure matches directly.

## Worker summary

Build succeeded. Here is a summary of what was changed in `src/App.tsx`:

**Part A — `project-header` region:** Replaced all 4 direct children of `data-testid="horizontal-nav-header.ui.project-header.header"`:
1. **Col 1 (avatar):** Changed 5 `display:contents` divs → 4 real nested `<div>`s containing the `img[editable-avatar]`
2. **Col 2 (project name):** Restructured to `div > form > div > div > [button(invisible overlay, aria-label="Edit, Space name") + div[role=presentation] > div > h1 > div[read-view "Autoloop"]]`
3. **Col 3 (team + action-menu):** Changed `display:contents` wrappers → `div > [div>button[team-button-trigger] + div>div[role=presentation]>button[navigation-project-action-menu]]`
4. **Col 4 (share + automation):** Added `id="po-spotlight-share-button" data-vc="share-button"` to share button; made automation `div[role=presentation]` a real div (not display:contents); wrapped button children as `span > span[role=img]`

**Part B — `board-canvas` region:** Restructured the entire `BoardView` return:
- Each column now wrapped in `div[data-vc="business-board-column"]`
- `column-header` uses `draggable="true"` + `div > div > form > div > div > [button(overlay) + div[role=presentation] > div > [div[column-header.name, role=heading, aria-level=3] + div(count)]]`
- Collapse/more-actions buttons moved inside `div[data-component-selector="board.content.column.column-header.collapse-button-wrapper"]` with `span > span[aria-hidden] + span.vh-sr` children
- Cards restructured as `div[role=listitem] > [div×3>button(ghost) + div[board.content.cell.card, data-vc] > [a(draggable link) + div(summary: span>span>span>div[role=pres]>button + card title) + div(metadata: div>div[role=pres]>img[alt=Task] + div(key) + div[role=pres]>button>img(priority) + div[role=pres]>div>div>button>span>span[aria-hidden](assignee)]]`
- Add-column button wrapped in real `div[role=presentation]` with `span[role=img, aria-label="Create status"]` child
