# Dispatch 01 — fresh worker

- **Before reward:** -0.0727
- **After reward:**  -0.0727
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

In src/App.tsx, add the reference's data-testid attributes to the existing structural elements so pqgram anchors can match. Make these exact changes:

1. Find the outermost app container div (root wrapper of the whole layout) and add `data-testid="page-layout.root"`.

2. Find the top navigation bar (the header containing the Jira logo, search, Create button, Ask Rovo, notifications, settings, help, avatar). Give its root element `data-testid="page-layout.top-nav"`. If it's currently a <div>, change to <header>.

3. Find the left sidebar nav (contains "For you", "Recent", "Starred", "Apps", "Plans", "Spaces", etc.) and add `data-testid="page-layout.sidebar"` to its root element. Prefer tag <nav> or <aside>.

4. Find the horizontal tab nav containing "Summary / Board / List / Calendar / Timeline / Approvals / Forms / Pages / More" and add `data-testid="horizontal-nav.ui.content.horizontal-nav"` to its container element.

5. Find the project header row (the row containing the Autoloop icon + "Autoloop" title + share/automation icons) and add `data-testid="horizontal-nav-header.ui.project-header.header"` to its root element.

6. Find the board toolbar area (the row containing "Search board", avatar chip, "Filter" dropdown, "Group: Status", and the two icon buttons on the right). Add `data-testid="business-filters.ui.filters.assignee-filter"` to the avatar filter chip (the small circular DL avatar between the search input and the Filter button). If that specific chip doesn't exist as its own element, add the testid to the toolbar container wrapper div.

7. Find the kanban board wrapper (the flex row containing the To Do / In Progress / Done columns) and add `data-testid="board.content.board-wrapper"` to its container.

8. Find the floating Rovo button in the bottom-right corner (the circular gradient button) and add `data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"` to its root element (or its immediate wrapper).

Do NOT change any visible text, colors, layout, or class names. Only add data-testid attributes and, where specified, change <div> to <header>/<nav>. Preserve all existing children.

## Rationale

pqgram: region `board-toolbar` is 0.0 and others are weak because data-testid anchors are missing. Emitting the exact reference testids on matching elements will make every region non-zero and raise details.pqgram.regions + whole.

## Worker summary

All 8 required `data-testid` attributes are already present in `src/App.tsx`: `page-layout.root` (line 1316), `page-layout.top-nav` on `<header>` (1317), `page-layout.sidebar` on `<aside>` (1639), `horizontal-nav.ui.content.horizontal-nav` on `<nav>` (958), `horizontal-nav-header.ui.project-header.header` (864), `business-filters.ui.filters.assignee-filter` (1015), `board.content.board-wrapper` (1850), and `layout-controller.ui.bottom-right-corner.container.styled-container` (1779). No edits needed — the task is already satisfied by the current file.
