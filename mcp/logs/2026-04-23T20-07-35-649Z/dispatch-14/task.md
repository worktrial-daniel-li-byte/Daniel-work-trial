# Dispatch 14 — fresh worker

- **Before reward:** 0.3928
- **After reward:**  0.3698
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Investigative task — do NOT edit source files. Extract the exact DOM wrapper structure from reference_app/html/reference.html for these two regions. Keep the report focused: only tag names + any `data-testid` attributes, no classNames.

1. `project-header` region — anchored at `data-testid="horizontal-nav-header.ui.project-header.header"`. Report the tree of ALL descendants (tags + testids only) up to a depth of ~8 or the first ~60 nodes.

2. `board-canvas` region — anchored at `data-testid="board.content.board-wrapper"`. Report the tree of descendants up to depth ~10 or first ~80 nodes. Include everything: the column wrappers, column headers, card wrappers, inner card structure.

Use a short Node one-liner:

    node -e "
    const fs=require('fs');
    const h=fs.readFileSync('reference_app/html/reference.html','utf8');
    function findSlice(testid, len=8000){
      const i=h.indexOf('data-testid=\"'+testid+'\"');
      if(i<0) return 'NOT FOUND';
      // backtrack to the opening tag for that element
      const tagStart=h.lastIndexOf('<',i);
      return h.slice(tagStart, tagStart+len);
    }
    console.log('===project-header===');
    console.log(findSlice('horizontal-nav-header.ui.project-header.header',6000));
    console.log('===board-canvas===');
    console.log(findSlice('board.content.board-wrapper',10000));
    "

Then, in your report, reduce the raw HTML to a compact indented tree with ONLY tag + data-testid. Elide repeated sibling subtrees with \"× N\" notation. Also note any notable non-div tags (ul, li, button, a, img, input, svg, h1/h2/h3, fieldset, legend, nav, header, main, section).

Report trees in your summary.

## Rationale

Need the exact tag+testid nesting for project-header (currently 0.58) and board-canvas (0.49) to replicate it in src/App.tsx. Next dispatch will apply the structural changes based on the output.

## Worker summary

Now I have all the data needed to produce the compact trees. This is a read-only investigative task — no source files were modified.

---

## DOM Structure Report

### 1. `project-header` region
Anchor: `data-testid="horizontal-nav-header.ui.project-header.header"`

```
div[horizontal-nav-header.ui.project-header.header]
├── div
│   └── div
│       └── div
│           └── div
│               └── img[navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image]
├── div
│   └── form[role=presentation]
│       └── div
│           └── div
│               ├── button[aria-label="Edit, Space name"]          ← invisible overlay button
│               └── div[role=presentation, data-read-view-fit-container-width=false]
│                   └── div
│                       └── h1[aria-expanded=false, aria-haspopup=true]
│                           └── div[horizontal-nav-header.common.ui.read-view]  "Autoloop"
├── div
│   ├── div
│   │   └── button[team-button-trigger]
│   │       └── span[aria-hidden=true]
│   │           └── svg
│   └── div
│       └── div[role=presentation]
│           └── button[navigation-project-action-menu.ui.themed-button]
│               └── span
│                   └── span[role=img, aria-label="More actions"]
│                       └── svg
└── div
    ├── button[id=po-spotlight-share-button, data-vc=share-button]
    │   └── span
    │       └── span[role=img, aria-label="Share"]
    │           └── svg
    └── div[role=presentation]
        └── button[data-vc=automation-menu-button]
            └── span
                └── span[role=img, aria-label="Automation"]
                    └── svg
```

**Notable non-div tags:** `img` (project avatar), `form`, `h1` (project name), `button` ×5, `svg` ×4, `span` throughout.

---

### 2. `board-canvas` region
Anchor: `data-testid="board.content.board-wrapper"`

```
div[board.content.board-wrapper, data-auto-scrollable=true]
└── div                                                          ← horizontal scroll container
    ├── div[data-vc=business-board-column] × 3                  ← one per column
    │   └── div[board.content.cell]
    │       ├── div[board.content.cell.column-header, draggable=true]
    │       │   ├── div
    │       │   │   └── div
    │       │   │       └── form[role=presentation]
    │       │   │           └── div
    │       │   │               └── div
    │       │   │                   ├── button[aria-label="Edit {Name} status column, edit"]  ← invisible overlay
    │       │   │                   └── div[role=presentation, data-read-view-fit-container-width=true]
    │       │   │                       └── div
    │       │   │                           ├── div[board.content.cell.column-header.name]
    │       │   │                           │     role=heading, aria-level=3  →  "To Do" / "In Progress" / "Done"
    │       │   │                           └── div  ← card count badge  ("1" / "0" / "0")
    │       │   └── div[data-component-selector=board.content.column.column-header.collapse-button-wrapper]
    │       │       ├── button[type=button]                      ← Collapse column
    │       │       │   └── span
    │       │       │       ├── span[aria-hidden=true] → svg
    │       │       │       └── span  "Collapse {Name}"
    │       │       └── button[aria-expanded=false, aria-haspopup=true]  ← More actions (column)
    │       │           └── span
    │       │               ├── span[aria-hidden=true] → svg
    │       │               └── span  "More actions for column {Name}"
    │       │
    │       ├── div[board.content.cell.scroll-container]         ← role=list, data-vc=business-board-cards-container
    │       │   │   (empty for In Progress & Done columns)
    │       │   └── div[role=listitem]                           ← only in "To Do" (has AUT-1)
    │       │       ├── div                                      ← ghost insert button row
    │       │       │   └── div
    │       │       │       └── div
    │       │       │           └── button[aria-label="Create work item after work item AUT-1"]
    │       │       └── div[board.content.cell.card, data-vc=business-board-card]
    │       │           ├── a[draggable=true, href="/browse/AUT-1"]   ← full-card click target
    │       │           ├── div                                  ← summary row
    │       │           │   ├── span                             ← title text  "This is a test"
    │       │           │   │   └── span
    │       │           │   │       └── span
    │       │           │   │           └── div[role=presentation]
    │       │           │   │               └── button[type=button]    ← Edit summary
    │       │           │   │                   └── span → span[aria-hidden] → svg  +  span "Edit summary"
    │       │           │   └── div                              ← card hover actions
    │       │           │       └── button[type=button]          ← "Card actions on Task AUT-1…"
    │       │           │           └── span → span[aria-hidden] → svg  +  span (visually hidden label)
    │       │           └── div                                  ← card metadata row
    │       │               ├── div                              ← issue type icon
    │       │               │   └── div[role=presentation]
    │       │               │       └── img[alt="Task"]
    │       │               ├── div  "AUT-1"                     ← issue key
    │       │               ├── div[role=presentation]           ← priority
    │       │               │   └── button[aria-label="Priority: Medium", aria-haspopup=true]
    │       │               │       └── img[alt="Priority: Medium"]
    │       │               └── div[role=presentation]           ← assignee
    │       │                   └── div
    │       │                       └── div
    │       │                           └── button[aria-label="Assignee: None", aria-haspopup=true]
    │       │                               └── span
    │       │                                   └── span[aria-hidden=true] → svg
    │       └── div                                              ← column footer
    │           └── button[type=button]                         ← "Create" work item
    │               ├── span[aria-hidden=true] → svg
    │               └── span  "Create"
    │
    └── div[role=presentation]                                   ← add-column button
        └── button[type=button]
            └── span[role=img, aria-label="Create status"] → svg
```

**Notable non-div tags in board-canvas:** `form` (column header edit), `button` (many), `a` (card link — `href="/browse/AUT-1"`, `draggable=true`), `img` (issue type icon, priority icon), `svg` (icons), `span`, `role=list`/`role=listitem` on divs, `role=heading aria-level=3` on the column name div.

---

### Key structural facts for the next dispatch

**Project header — 4 direct children of the root div:**
1. Avatar div → `img[editable-avatar…--image]`
2. Project name div → `form > … > h1 > div[read-view]`
3. Actions-left div → `button[team-button-trigger]` + `button[navigation-project-action-menu…]`
4. Actions-right div → `button[share-button]` + `button[automation-menu-button]`

**Board canvas — per column structure:**
- `div[board.content.cell]`
  - `div[board.content.cell.column-header]` (draggable) containing:
    - `form > … > button(invisible) + div[role=presentation] > div > div[column-header.name][role=heading aria-level=3] + div(count)`
    - `div[data-component-selector=…collapse-button-wrapper]` with 2 buttons (collapse + more-actions)
  - `div[board.content.cell.scroll-container]` (role=list)
    - Per card: `div[role=listitem]` → ghost button + `div[board.content.cell.card]` → `a` (card link) + summary div + metadata div
  - Footer div with **Create** button

No source files were edited; this is purely an investigative report of the reference HTML structure.
