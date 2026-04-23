# Dispatch 01 — fresh worker

- **Before reward:** -0.0718
- **After reward:**  n/a
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx to add `data-testid` attributes on the existing structural elements so the DOM matches the reference. The app already renders a Jira-like layout with a top nav, sidebar, horizontal nav, project header, and board. Add these exact data-testid values to the appropriate existing elements (do NOT restructure layout — just add the attribute to the element that already plays that role):

1. The outermost app-shell root div (the one wrapping the entire layout): add `data-testid="page-layout.root"`
2. The top header/nav bar element (the bar containing logo, Search, Create button, Premium trial, Ask Rovo, bell, settings, avatar): add `data-testid="page-layout.top-nav"`. Use a `<header>` tag if it isn't already.
3. The left sidebar container (the nav with For you / Recent / Starred / Apps / Plans / Spaces / Autoloop …): add `data-testid="page-layout.sidebar"`. Use `<aside>` or `<nav>` tag.
4. The horizontal nav wrapper that contains Summary / Board / List / Calendar / Timeline / Approvals / Forms / Pages / More tabs: add `data-testid="horizontal-nav.ui.content.horizontal-nav"`.
5. The "Autoloop" project-header block (the one with Spaces breadcrumb, Autoloop title, and the share/… buttons at the far right): add `data-testid="horizontal-nav-header.ui.project-header.header"`.
6. The board toolbar assignee-filter avatar element (the small circular avatar button between "Search board" input and "Filter" dropdown, shown as "DL" avatar): add `data-testid="business-filters.ui.filters.assignee-filter"`.
7. The board wrapper div that contains the To Do / In Progress / Done columns: add `data-testid="board.content.board-wrapper"`.
8. The floating Rovo FAB container at bottom-right (the circular gradient button in the bottom-right corner): add `data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"`.

Only modify src/App.tsx. Keep all existing classes, children, and behavior. Just add the data-testid props. Report back which elements you tagged.

## Rationale

pqgram is 0.21 and several regions score 0 or near-zero because our DOM lacks the reference's data-testid anchors. Adding these testids should substantially raise pqgram (whole + regions), especially modal-portal/rovo-fab/board-toolbar/left-nav/project-header.

## Worker summary

Edited `src/App.tsx`: items 1–5, 7, and 8 already had the correct `data-testid` attributes in place. I moved `data-testid="business-filters.ui.filters.assignee-filter"` off the `jira-board-bar` wrapper and onto the `jira-board-bar__avatar-stack` (the DL assignee avatar element) as the task specified.
