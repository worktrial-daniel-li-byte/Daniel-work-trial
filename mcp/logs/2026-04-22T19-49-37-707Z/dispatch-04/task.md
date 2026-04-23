# Dispatch 04 — resumed worker

- **Before reward:** -0.1215
- **After reward:**  -0.1302
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

In src/App.tsx, find the top navigation bar (the section containing "Premium trial", "Ask Rovo", and the "DL" avatar on the right side of the topbar). Between "Ask Rovo" and the "DL" avatar there should be three icon buttons but they appear to be missing or invisible in the current render:

1. A bell / notifications icon button with a "3+" badge on top of it (the "3+" text exists but the bell icon around it is missing or invisible)
2. A settings / gear icon button
3. A help / question mark "?" icon button

Please ensure these three buttons are rendered clearly. Use these SVG icons inline:
- Bell icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
- Gear icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
- Help icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`

Each icon should be wrapped in a button with color: #44546f (slate gray). The bell button should have the "3+" badge positioned at top-right of the icon. Set button sizes to ~32px x 32px with no background.

If these buttons already exist in src/App.tsx, check src/App.css to ensure they have a visible color (not transparent or white). Look for classes like .topbar-icon, .icon-btn, .topbar-btn, or similar and make sure `color: #44546F` is set.

## Rationale

The topbar icons in the reference are clearly visible gray icons (bell, gear, ?) but in the current app they seem to be missing or rendered invisibly. Adding them should improve SSIM in the top-right region.

## Worker summary

Edited src/App.css (changed `.jira-icon-btn` color from `var(--jira-text-sub)` to `#44546F`, and `.jira-help-btn` color to `#44546F`) and src/App.tsx (replaced the bell, gear, and help SVGs with the exact icons from the task spec at stroke-width 2 so the three topbar icons render clearly in slate gray).
