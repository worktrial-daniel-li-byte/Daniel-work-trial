# Dispatch 01 — fresh worker

- **Before reward:** -0.1057
- **After reward:**  -0.1057
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Update the top navigation and sidebar to match the reference:

1. **Top nav (header)**: 
   - Add "Jira" text/brand label next to the logo icon (currently shows only the logo).
   - Replace the generic icons with: "Premium trial" button (with a gem/diamond icon), then an "Ask Rovo" button (with colorful logo), then a notifications bell with a "3+" badge (currently shows "2"), then a settings gear, then a help icon, then user avatar with initials "DL" (currently "F").
   - Remove the colorful swirl icon; the avatar should show "DL" on a purple background.

2. **Sidebar tabs/labels**: The reference has these sidebar items in order:
   - For you, Recent (with chevron), Starred (with chevron), Apps, Plans
   - Section header "Spaces" with a "+" and "..." on the right
   - Section header "Recent"
   - "Autoloop" (selected/highlighted)
   - "More spaces" (with chevron)
   - Section header "Recommended"
   - "Create a roadmap" with a "TRY" badge on the right
   - "Import work"
   - Filters, Dashboards
   - "Confluence" (with external link icon on right)
   - "Goals" (with external link icon)
   - "Teams" (with external link icon)
   - "More" at bottom with "..." icon prefix
   - Remove "Give feedback" and "Enter full screen" items.

3. **Board tabs row**: The reference has tabs in this order: Summary, Board (selected, underlined), List, Calendar, Timeline, Approvals, Forms, Pages, More 4, then "+". Update to match. Currently we have: Summary, Board, List, Calendar, Timeline, Approvals, Forms, Pages, Attachments, Reports, Archived work items, Shortcuts. Replace the last four with a single "More 4" item.

4. **Autoloop header area**: After "Autoloop" title, show a small "people/members" icon button, then "..." button. Add a row of icons on the far right: share icon, lightning/activity icon, a swap/exchange icon, and a fullscreen/expand icon.

5. **Board column bodies**: Remove the "Drop cards here" placeholder boxes in empty In Progress and Done columns — the reference just shows the "+ Create" button directly. Also for the To Do column, remove the Edit/Delete buttons on the card; the card should just show "This is a test" title with a checkbox "AUT-1" badge, a small "=" priority icon, and a user avatar on the right.

Files to edit are likely under src/components/ (Sidebar, TopNav/Header, Board, Card components). Keep existing structure but update labels, icons, and remove the placeholder text.

## Rationale

Text score is lowest (0.49). Adding the correct sidebar labels ("Jira", "Spaces", "Recent", "Recommended", "Create a roadmap", "Confluence", "Goals", "Teams") and tab labels ("More 4") plus removing wrong text ("Give feedback", "Enter full screen", "Drop cards here", "Attachments/Reports/..") should significantly raise text match. Will also improve SSIM by matching structure.

## Worker summary

Now I have a good understanding. Let me make the edits. I'll update:

1. **TABS** to match reference (Summary, Board, List, Calendar, Timeline, Approvals, Forms, Pages, More 4)
2. **Sidebar sections** to add chevrons/badges/external icons as needed
3. **Header**: add "Jira" wordmark, change avatar to DL/purple, badge to "3+", remove colorful swirl, add gem icon for Premium trial, keep other icons
4. **Autoloop header area**: add members icon + buttons on far right
5. **Board column empty**: remove "Drop cards here"
6. **Card**: remove Edit/Delete buttons, add a checkbox

Let me also check the fixtures / reference folders to understand the structure better, but I'll keep edits focused. (hit maxWorkerTurns)
