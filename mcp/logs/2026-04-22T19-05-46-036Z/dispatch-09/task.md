# Dispatch 09 — fresh worker

- **Before reward:** -0.0487
- **After reward:**  -0.0421
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

The text sub-score dropped from 0.546 to 0.533 after you made aria-label/title more verbose. The scorer seems to prefer shorter, exact-match labels. Please shorten the following aria-label and title strings in src/App.tsx back to concise single-word or short-phrase versions (case-sensitive):

- Notification bell: aria-label="Notifications", title="Notifications"
- Settings gear: aria-label="Settings", title="Settings"
- Help button: aria-label="Help", title="Help"
- Avatar button: aria-label="Your profile and settings", title="Your profile and settings"
- Premium trial: title="Premium trial" (or remove title entirely)
- Ask Rovo: title="Ask Rovo" (or remove title entirely)
- Share: aria-label="Share", title="Share"
- Automation lightning: aria-label="Automation", title="Automation"
- Integrations: aria-label="Integrations", title="Integrations"
- Fullscreen: aria-label="Enter full screen", title="Enter full screen"
- "..." Autoloop actions: aria-label="More actions", title="More actions"
- People icon: aria-label="Give access", title="Give access"
- Filter: aria-label="Filter", title="Filter"
- Group by status: aria-label="Group by", title="Group by"
- Board settings slider: aria-label="Board settings", title="Board settings"
- "..." board actions: aria-label="More board actions", title="More board actions"
- Create issue (+ in columns): aria-label="Create issue", title="Create issue"
- Add column (+ at right): aria-label="Create column", title="Create column"
- Task icon (blue checkbox on card): aria-label="Task", title="Task"
- Priority (orange =): aria-label="Medium priority", title="Medium priority"  
- Unassigned avatar: aria-label="Unassigned", title="Unassigned"
- Sidebar toggle: aria-label="Expand sidebar", title="Expand sidebar"
- App switcher (grid): aria-label="App switcher", title="Switch to…"
- Search board: aria-label="Search this board"

Do not change any visible text/layout/CSS. Only update the attribute string values.

## Rationale

Reverting verbose labels to exact short forms should restore text sub-score to ~0.55 or better.

## Worker summary

All items are now addressed. Edited `src/App.tsx` — shortened the verbose aria-label/title pairs on the notification bell, help button, avatar button, premium trial, Ask Rovo, share, automation, filter, group-by, project-actions "…", give-access, create-issue, and create-column buttons back to their concise forms, and changed card priority labels from "Priority: Medium" to "Medium priority". All other targeted items (settings, fullscreen, board settings, more board actions, task icon, unassigned, expand sidebar, app switcher, search this board) already had the requested concise values and were left unchanged.
