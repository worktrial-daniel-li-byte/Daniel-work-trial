# Dispatch 01 — fresh worker

- **Before reward:** -0.0760
- **After reward:**  -0.0775
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx to add three missing data-testid anchors that the reference DOM has:

1. **Board toolbar assignee filter**: Find the toolbar area with the "Search board" input and "Filter" button. The avatar/user chip next to the search input (the round DL avatar button) should be wrapped in a div with `data-testid="business-filters.ui.filters.assignee-filter"`. If there is no such element, add a `<div data-testid="business-filters.ui.filters.assignee-filter"><div><button type="button"><span>DL</span></button></div></div>` inline between the search input and the Filter button.

2. **Rovo FAB**: At the bottom-right of the viewport the reference shows a small round floating button. Add (near the end of the main app JSX, as a sibling of the main content) a:
```
<div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container">
  <div>
    <button type="button" aria-label="Rovo">
      <span></span>
    </button>
  </div>
</div>
```
Style it via src/App.css with `[data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"] { position: fixed; right: 24px; bottom: 24px; z-index: 100; }` and give the inner button width/height 48px, border-radius 50%, background #fff, border 1px solid #dfe1e6, box-shadow 0 2px 6px rgba(0,0,0,0.15).

3. **Modal portal container**: At the very end of `<body>`, there needs to be an element matching `body > .atlaskit-portal-container`. The cleanest way: in src/main.tsx (or wherever ReactDOM renders), after mounting the app, append an empty `<div class="atlaskit-portal-container"></div>` as a direct child of document.body. Alternatively edit index.html to include `<div class="atlaskit-portal-container"></div>` right before `</body>`. Use whichever is simpler given the existing file structure.

Keep all existing markup intact — these are additive changes. Don't reformat unrelated code.

## Rationale

pqgram: three regions currently score 0.0000 (board-toolbar, modal-portal, rovo-fab). Emitting the exact data-testid values the reference uses will make those region subtrees match and lift details.pqgram.regions mean substantially, which flows into pqgram.combined.

## Worker summary

All three changes are in place. Summary:

- **src/App.tsx**: Restructured the assignee filter to use `<div data-testid="business-filters.ui.filters.assignee-filter"><div><button type="button"><span>DL</span></button></div></div>` matching the reference DOM, and restructured the Rovo FAB inner markup to `<div><button aria-label="Rovo"><span></span></button></div>` under the existing `data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"` wrapper.
- **src/App.css**: Added styles pinning the FAB container to fixed bottom-right (24px/24px, z-index 100) with a 48px round white button (1px #dfe1e6 border, 0 2px 6px rgba(0,0,0,0.15) shadow), plus a small `.jira-board-bar__avatar-btn` reset.
- **index.html**: already contained `<div class="atlaskit-portal-container"></div>` as a direct child of `<body>`, so no edit was needed for item 3.
