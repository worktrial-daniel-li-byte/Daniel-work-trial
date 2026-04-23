# Dispatch 05 — fresh worker

- **Before reward:** -0.0326
- **After reward:**  -0.0328
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

The search bar in the topbar is too narrow and positioned too far left. In the reference, the Search input is ~760px wide and sits roughly centered, with the "+ Create" button immediately to its right, and the right cluster (Premium trial, Ask Rovo, bell, settings, help, avatar) sitting at the far right edge.

Edit src/App.css only:

1. Find the `.jira-topbar__center` rule and change it to:
```
.jira-topbar__center {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 16px;
}
```

2. Find `.jira-topbar__search` (or whatever class wraps the search input) and update:
```
.jira-topbar__search {
  flex: 1 1 760px;
  max-width: 760px;
  min-width: 0;
}
```
Also ensure the inner search input fills its wrapper: any `.jira-topbar__search input` rule should have `width: 100%`.

3. Update the "3+" notification badge to better match the reference: lighter blue background, darker text. Replace the `.topbar-bell .badge` rule with:
```
.topbar-bell .badge {
  position: absolute;
  top: -2px;
  right: -6px;
  background: #cce0ff;
  color: #0055cc;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 8px;
  line-height: 1.3;
  letter-spacing: 0.02em;
}
```

Do not change any other CSS or any TSX.

## Rationale

Widening the search input so the topbar layout matches the reference should be a big SSIM win; correcting the badge color pushes color score.

## Worker summary

Edited src/App.css: widened `.jira-topbar__center` (added 16px horizontal padding) and `.jira-topbar__search` to flex 1 1 760px / max-width 760px with a `.jira-topbar__search input { width: 100% }` rule, and restyled `.topbar-bell .badge` to light blue (#cce0ff) with darker blue text (#0055cc) per spec.
