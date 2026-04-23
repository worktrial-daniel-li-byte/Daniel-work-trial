# Dispatch 05 — resumed worker

- **Before reward:** -0.0727
- **After reward:**  -0.0651
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Edit src/App.tsx to add missing data-testid attributes that match the reference DOM. These are pure attribute additions and should not change any visible rendering, styling, or behavior.

Goal: raise pqgram region scores by emitting the exact testids that the reference uses. All testid strings must be copied VERBATIM (lowercase, dots, hyphens).

=== 1. Sidebar region (`page-layout.sidebar`) ===

Currently the sidebar is an `<aside data-testid="page-layout.sidebar">` containing a list-based structure. Do this:

a) Change the sidebar's outer tag from `<aside>` to `<nav>`. Keep data-testid and all children/props identical.

b) The top nav items (For you / Recent / Starred / Apps / Plans) are items at the top of the sidebar. Find the "For you" item (an `<a>` or `<button>` with visible text "For you"). Wrap it in a `<div data-testid="NAV4_for-you-container">` and add `data-testid="NAV4_for-you"` to the For-you element itself.

c) Find the "Apps" item in the sidebar (button or link with text "Apps"). Give its container `<div data-testid="NAV4_jira.sidebar.apps-container">` and add `data-testid="NAV4_jira.sidebar.apps"` on the Apps element itself.

d) Find the "More" item at the bottom of the sidebar (text "More"). Add `data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger"` to that button.

=== 2. Board canvas region (`board.content.board-wrapper`) ===

The board contains three columns (To Do, In Progress, Done) and cards. Locate the JSX that renders each column and each card.

a) Each column's root element: add `data-testid="board.content.cell"` on the column root `<div>`.

b) Each column header (the strip with the column name and count, "To Do 1", "In Progress 0", "Done 0"): wrap or mark its container with `data-testid="board.content.cell.column-header"`. Inside, wrap the column name text element with `data-testid="board.content.cell.column-header.name"`.

c) Each column's scrollable card-list region (the element that actually contains the card children, between header and footer Create button): add `data-testid="board.content.cell.scroll-container"`.

d) Each individual card (currently rendered as `<article>` for the "This is a test" card): add `data-testid="board.content.cell.card"` to the card's root element. If the card is currently an `<article>`, you can keep it `<article>` — only add the testid.

=== 3. Rovo FAB region ===

Currently the FAB is `<div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"> <div> <button> ... </button> </div> </div>`.

Add three extra wrapper `<div>`s so the button is 4 wrapper-divs deep inside the container (to mirror reference). The resulting JSX inside the styled-container should be:

```jsx
<div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container">
  <div>
    <div>
      <div>
        <div>
          <div>
            <button data-testid="platform-ai-button" ...existing props>
              ...existing children
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Also add `data-testid="platform-ai-button"` to the FAB button itself (preserve existing attributes, just add this one).

These new wrapper divs must have NO styling that would change the button's position/appearance. Use `style={{display:'contents'}}` on each inner wrapper div so they are DOM-structural but visually invisible. (display:contents makes the wrapper contribute zero box to layout, so the button renders exactly where it did before.)

=== Constraints ===

- Do not change or remove any existing text, className, style, aria-, onClick, or children.
- Do not remove any existing data-testid attributes.
- Only edit src/App.tsx.
- After edits, save the file. The dev server should hot-reload.

Report what you changed.

## Rationale

pqgram: adds the missing `board.content.cell*`, `NAV4_*`, `platform-ai-button` testids and corrects the sidebar tag (`aside` → `nav`). These directly raise the sidebar, board-canvas, and rovo-fab region scores, and contribute to `whole`. The display:contents wrappers let us match reference's nesting depth without altering visible layout (ssim stays steady).

## Worker summary

All 11 new testids confirmed in the live DOM. Here's a summary of every change made to `src/App.tsx`:

1. **Sidebar tag** (`<aside>` → `<nav>`): Changed both the opening and closing tag of `page-layout.sidebar` to `<nav>` to match the reference.

2. **Sidebar items loop** — added conditional testids without duplicating child JSX:
   - "For you" button wrapped in `<div data-testid="NAV4_for-you-container">`, button gets `data-testid="NAV4_for-you"`
   - "Apps" button wrapped in `<div data-testid="NAV4_jira.sidebar.apps-container">`, button gets `data-testid="NAV4_jira.sidebar.apps"`
   - "More" button gets `data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger"`

3. **Board canvas** — pure attribute additions, no structural changes:
   - Column root `<div>` → added `data-testid="board.content.cell"`
   - Column header `<div className="jira-col__head">` → added `data-testid="board.content.cell.column-header"`
   - Column name `<span className="col-label">` → added `data-testid="board.content.cell.column-header.name"`
   - Card list `<div className="jira-col__cards">` → added `data-testid="board.content.cell.scroll-container"`
   - Card `<article>` → added `data-testid="board.content.cell.card"`

4. **Rovo FAB** — added 4 `display:contents` wrapper divs to match reference nesting depth, and added `data-testid="platform-ai-button"` to the button.
