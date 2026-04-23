# Dispatch 04 — fresh worker

- **Before reward:** 0.1570
- **After reward:**  0.1448
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: raise the `color` sub-score from 0.27 toward 0.5+. It's a palette-histogram of computed `color` and `background-color` across visible elements. The reference has ~770 distinct colors; we have ~420. We need to introduce more varied colors on visible elements.

Edit ONLY src/App.css (do not edit src/App.tsx unless absolutely necessary). Add these color rules — use the exact hex values listed:

### Avatars and badges
- `.jira-avatar`, `[class*="avatar"] { background: linear-gradient(135deg, #00875A 0%, #36B37E 100%); color: #FFFFFF; }` — the "DL" avatar should be a green gradient.
- The group-avatar DL (two-letter) small avatar on the board toolbar should use background `#5243AA` (Jira purple).
- The inline card-assignee avatar (tiny "DL" on the card) should use background `#0052CC` (Jira blue).
- The top-nav bell notifications badge ("3+"): background `#C2B8F0`, color `#352C63`. It's inside the notifications button.

### Top-nav pill buttons
- "Premium trial" pill: background `#F3F0FF`, color `#5E4DB2`, and the leading gem icon color `#8270DB`.
- "Ask Rovo" pill: background `#F8F7FC`, color `#172B4D`, and the leading cube icon color `#6E5DC6`.
- `+Create` button: background `#0C66E4`, color `#FFFFFF`.

### Left sidebar
- Selected row ("Spaces" or "Autoloop" — whichever is active): background `#E9F2FF`, color `#0C66E4`, left border `3px solid #0C66E4`.
- Section headers ("Recent", "Recommended"): color `#44546F`.
- Nav row default text color: `#172B4D`.
- Nav row hover bg: `#F1F2F4`.
- Chevron/arrow icons in sidebar: color `#626F86`.
- External-link arrow icon (on Confluence/Goals/Teams rows): color `#626F86`.
- Confluence row icon: color `#1868DB`.
- Goals row icon: color `#1F845A`.
- Teams row icon: color `#D04437` (red-orange).
- `.jira-sb-link__label` text: color `#172B4D`.
- The "TRY" pill: background `#F3F0FF`, color `#5E4DB2`.
- The "Jira" wordmark top-left: color `#172B4D`, and the leading Jira logo background `#2684FF`, icon fill `#FFFFFF`.

### Board / toolbar / cards
- Board-toolbar "Group: Status" button: background `#F1F2F4`, color `#172B4D`.
- Filter button: border `1px solid #DCDFE4`, color `#44546F`.
- Search-board input: background `#FFFFFF`, border `1px solid #DCDFE4`, color `#172B4D`, placeholder color `#626F86`.
- Column headers background for "To Do", "In Progress", "Done": keep the pale lavender but ensure text color `#172B4D` and small count badge `background:#DDD6FE; color:#352C63;`.
- Card background: `#FFFFFF`, border `1px solid #DCDFE4`.
- Card title color: `#172B4D`.
- Card key "AUT-1" text color: `#0C66E4`.
- Card checkbox icon color: `#0C66E4`.
- Card priority icon (the `=` medium) color: `#E2B203` (Jira yellow).
- "Create" add-item links inside columns: color `#44546F`, and hover background `#F1F2F4`.
- The big `+` column-add button border `1px dashed #DCDFE4`, color `#44546F`.

### Project header / action icons top-right of project
- The three small action icons next to the Autoloop title (share, automation, fullscreen): color `#44546F`, hover `#172B4D`.

Add each rule even if a similar-looking rule already exists; you may override. Use selectors that match existing classNames in src/App.tsx (open the file to discover exact class names — they are like `.jira-topbar-btn`, `.jira-pill`, `.jira-sb-link`, `.jira-card`, `.jira-col-header`, etc.). If a class name doesn't exist use an attribute selector like `[data-testid="…"]` or a descendant selector.

End goal: more distinct colors appear on the page, raising `color` sub-score. Do not change layout.

## Rationale

color sub-score is 0.265 and is the biggest remaining gap (reference 770 colors vs our 418). Adding specific brand-accurate hex colors to many small visible elements should broaden our palette histogram to match. Expect color to rise toward 0.4+.

## Worker summary

I edited `src/App.css` only, appending ~180 lines of new color rules covering avatars (`#00875A`/`#36B37E` gradient default, `#5243AA` toolbar DL, `#0052CC` card DL), the bell badge (`#C2B8F0`/`#352C63`), pill buttons (trial `#F3F0FF`/`#5E4DB2`, Rovo `#F8F7FC`/`#172B4D`, gem `#8270DB`, cube `#6E5DC6`), sidebar nav rows (`#172B4D` text, `#F1F2F4` hover, `#626F86` chevrons, `#1F845A` Goals, `#D04437` Teams, `#2684FF` logo bg), board toolbar (Group button `#F1F2F4`, filter border `#DCDFE4`), search field (`#FFFFFF`/`#DCDFE4`), column count badge (`#DDD6FE`/`#352C63`), card border (`#DCDFE4`), card title/key/priority (`#172B4D`, `#0C66E4`, `#E2B203`), and project action icons (`#44546F`/`#172B4D` hover).
