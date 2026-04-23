# Dispatch 04 — resumed worker

- **Before reward:** 0.2362
- **After reward:**  0.2359
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Two small changes in src/App.tsx:

1) Remove the "<" collapse-column buttons that appear next to each column's count badge. In the reference, the column header shows only the column name and the count number (e.g. "To Do 1") — there is no "<" chevron button between the count and the header's right edge. Search src/App.tsx for the column-header JSX — likely a button or span rendering a "<" or a ChevronLeft-style element immediately after the count badge inside each of the three columns (To Do / In Progress / Done). Delete those three "<" buttons entirely. Keep the count badges ("1", "0", "0") intact.

2) Just above each column's "Create" row, the reference shows a "+" icon before the word "Create" inside each of the 3 columns AND in the card's Create button (bottom of To Do column). Currently our three empty columns' Create links seem to have the "+" missing (look closely — our In Progress and Done columns just say "Create" with no plus). Make sure each column's Create link renders as:

    <span class="jira-col__create">
      <span class="jira-col__create-plus">+</span>
      Create
    </span>

Or whatever matches the existing class pattern used in the To Do column (which already shows "+ Create" at the bottom). Copy that exact structure to the In Progress and Done columns so they show "+ Create" too.

Report which JSX blocks you modified.

## Rationale

Text score (0.75): removing the extra "<" characters from column headers and ensuring consistent "+ Create" text in all columns will align visible text with the reference. Also improves visual parity for ssim.

## Worker summary

Build is clean. I modified two JSX blocks in **`src/App.tsx`**:

1. **Collapse/expand chevron buttons** (the `isCollapsed ? <expand-btn> : <collapse-btn>` conditional, lines ~2690–2708) — removed entirely. The column header now shows only the title and count badge, matching the reference.

2. **Create button content** (shared across all three columns via the `.map()`) — changed `<span>Create</span>` to `<span className="jira-col__create-plus">+</span><span>Create</span>`, so all columns now render `+ Create` consistently.
