# Dispatch 01 — fresh worker

- **Before reward:** -0.0366
- **After reward:**  -0.0357
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx and src/App.css to fix the top bar layout and icons.

Current order of top-bar right cluster: [Create button] [Premium trial] [Ask Rovo] [3+ badge] [settings gear] [help ?] [DL avatar]

Change it to match this exact order from left to right after the search input:
1. A blue "+ Create" button (keep existing styling — solid blue background #1868db or similar, white text, pill/rounded). It should sit RIGHT AFTER the search bar (not grouped with the far-right icons).
2. Then on the far right cluster, in this order:
   - "Premium trial" pill (with a diamond/gem icon)
   - "Ask Rovo" pill (with a cube icon)
   - A notification bell icon 🔔 with a small blue "3+" badge overlapping its top-right corner
   - A settings gear icon ⚙️
   - A help "?" circle icon
   - A circular "DL" avatar with purple background

Layout: the Search input is centered/flex-1. The "+ Create" button sits in the same flex row, appearing just to the right of Search (so Search is flanked by the sidebar toggle on the left, and the Create button is to its right, before a large gap that pushes Premium trial / Ask Rovo / bell / gear / help / avatar to the far right).

Concretely in src/App.tsx:
- Find the topbar JSX. Move the Create button so it appears immediately after the Search input element.
- Add a bell icon button (use an inline SVG bell or a lucide-react Bell if available; otherwise use the unicode 🔔 inside a button). Wrap it with a positioned span containing "3+" styled as a small rounded badge with blue background (#1868db) and white text, positioned absolute top:-4px right:-4px.
- Reorder so the far-right group is: Premium trial, Ask Rovo, Bell(with 3+ badge), Gear, Help, Avatar.

In src/App.css add:
.topbar-bell { position: relative; }
.topbar-bell .badge { position: absolute; top: -4px; right: -4px; background: #1868db; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 8px; line-height: 1.2; }

Do not touch the sidebar or the board columns.

## Rationale

Reorder topbar elements and add missing bell icon to match reference — should improve SSIM and text sub-scores.

## Worker summary

Changes made:
- **src/App.tsx**: Moved the `+ Create` button out of `.jira-topbar__right` so it now sits immediately after the search input (flanking the search with the right cluster still pushed to the far right). Replaced the notifications icon button to use the new `topbar-bell` wrapper with a sibling `<span class="badge">3+</span>`, and swapped the bell SVG for a cleaner bell shape. The far-right order is now: Premium trial → Ask Rovo → Bell (with 3+ badge) → Settings → Help → Avatar.
- **src/App.css**: Added `.topbar-bell` and `.topbar-bell .badge` rules per spec (absolute badge at top:-4px/right:-4px, blue `#1868db` bg, white text).
