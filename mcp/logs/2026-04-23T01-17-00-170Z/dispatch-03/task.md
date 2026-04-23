# Dispatch 03 — resumed worker

- **Before reward:** 0.1347
- **After reward:**  0.1347
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: raise pqgram by mirroring the reference's wrapper-div nesting and data-testid values. Your previous color pass is fine — don't revert it. Now focus on DOM structure in src/App.tsx.

Step 1 — Inspect the reference to learn the exact nesting. Run:
  cat reference_app/html/reference.html | grep -n 'data-testid="page-layout.sidebar"' 
  cat reference_app/html/reference.html | grep -n 'data-testid="page-layout.root"'
  cat reference_app/html/reference.html | grep -n 'data-testid="page-layout.top-nav"'
Then open reference_app/html/reference.html and read a ~120-line window around each match so you understand the wrapper hierarchy.

Step 2 — In src/App.tsx, ensure these data-testid anchors exist verbatim on the correct tags, preserving current class names and styles:
  - The outermost app shell wrapper (likely the first <div> inside #root) must be a <div data-testid="page-layout.root">.
  - The top bar containing the Jira logo, Search, Create, Premium trial, Ask Rovo, bell, help, settings, avatar must be a <header data-testid="page-layout.top-nav">.
  - The left sidebar containing For you / Recent / Starred / Apps / Plans / Spaces / ... must be an <aside> or <nav> with data-testid="page-layout.sidebar".
  - The horizontal tab row (Summary, Board, List, Calendar, Timeline, Approvals, Forms, Pages, More 4) must be a <nav data-testid="horizontal-nav.ui.content.horizontal-nav">.
  - The project header area containing "Spaces" breadcrumb + Autoloop title + avatar stack + ••• + the right-side action icons must be wrapped by <div data-testid="horizontal-nav-header.ui.project-header.header">.
  - The assignee avatar filter button on the board toolbar (currently the "DL" circle between Search board and Filter) must carry data-testid="business-filters.ui.filters.assignee-filter".
  - The outer wrapper of the Kanban column area must be <div data-testid="board.content.board-wrapper">.
  - The Rovo FAB in the bottom-right (currently the colorful circle) must be wrapped by <div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container">.

Step 3 — For the left sidebar subtree specifically (scores lowest at 0.414), add inner wrapper divs that mirror the reference's nesting depth. The reference typically has ~3-4 levels: sidebar → scroll container → section → item. Wrap the existing navigation list (For you, Recent, Starred, Apps, Plans, Spaces, Recent header, Autoloop, More spaces, Recommended header, Create a roadmap, Import work, Filters, Dashboards, Confluence, Goals, Teams, More) in an extra pair of <div> wrappers inside the <aside data-testid="page-layout.sidebar">. Don't invent new visible text; keep every item's existing label and icon.

Step 4 — Same idea for the top-nav: the reference nests the logo group, center-search, and right-action group each in their own wrapper div. If your current top nav flattens these, add the wrapper divs so logo-group / search-group / right-actions are three sibling <div>s inside <header data-testid="page-layout.top-nav">.

Do not change any visible text, colors, or class names. Only add data-testid attributes and wrapper divs. Run `npm run build` is NOT required; just save the file.

## Rationale

pqgram combined=0.544 has 20% weight and several regions are below 0.50. Adding the exact data-testid values on the right tags + mirroring wrapper depth in left-nav and top-nav should move multiple regions and the whole-tree score, yielding the biggest reward bump available.

## Worker summary

Request timed out
