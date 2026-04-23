# Dispatch 01 — fresh worker

- **Before reward:** -0.1057
- **After reward:**  -0.1548
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx and src/App.css to fix the left sidebar so it matches this exact structure and text:

TOP BRAND ROW (above the nav items):

- Two small square icon buttons on the left (sidebar toggle icon, and an apps/grid icon), then the text "Jira" in bold. Use simple unicode/SVG or emoji-like placeholders — key thing is the text "Jira" must appear.

MAIN NAV LIST (each row: icon on left, label, and a right chevron ">" for items that expand):

1. "For you"
2. "Recent"  (with right chevron ›)
3. "Starred" (with right chevron ›)
4. "Apps"
5. "Plans"
6. "Spaces"  (with a "+" button and a "..." button on its right)

UNDER SPACES, a small uppercase label "Recent" (muted gray), then:

- "Autoloop" — this row must be HIGHLIGHTED (selected state: light background, left purple border bar). Show a small blue square icon before the text.
- "More spaces" (with right chevron ›)

Then a small uppercase label "Recommended", then:

- "Create a roadmap"  — with a small pill badge "TRY" on the right
- "Import work"

Then these rows (each with icon on left):

- "Filters"
- "Dashboards"

Then a visual separator / spacing, then these rows each with a small external-link arrow icon "↗" on the right:

- "Confluence"
- "Goals"
- "Teams"

Bottom row:

- "More" (with a "..." icon prefix)

REMOVE the current radio-button-style bullets (the `○` circles). Do NOT show "Give feedback" or "Enter full screen" rows — those belong elsewhere.

Use muted gray text color (#44546f-ish) for normal items, and a light purple tint (#e9d8fd or similar) background for the selected "Autoloop" row with a purple left accent bar (#8777d9 or similar).

Keep the sidebar width around 256px and keep the existing light purple page background.

## Rationale

Sidebar has many text mismatches ("Jira", "Recent" section header, "TRY" badge, correct item ordering) and missing visual elements — should lift text, ssim, and color scores.

## Worker summary

The changes are complete. Summary:

**src/App.tsx** — Replaced the sidebar data model and rendering:

- Added a top brand row with two small square icon buttons (sidebar toggle + 4-square apps grid) and a bold "Jira" label.
- Restructured `SIDEBAR_SECTIONS` to match the spec: top items (For you / Recent › / Starred ›), mid (Apps / Plans), Spaces header with `+` and `…` actions, a "Recent" uppercase subsection containing a highlighted Autoloop (blue square swatch) and "More spaces" ›, Recommended uppercase (Create a roadmap with TRY badge, Import work), utils (Filters, Dashboards), a divider followed by external-link-arrow rows (Confluence, Goals, Teams), and a final "More" row with a dots icon.
- Added a new `SidebarIcon` component rendering distinct SVG icons per item (replacing the old `○` circle placeholder), plus badge/external/chevron affordances.
- Removed the "Give feedback" / "Enter full screen" footer buttons.

**src/App.css** — Updated sidebar styling:

- Sidebar width set to 256px and background to the light purple page tint.
- New `.jira-sidebar__brand` row styles, `.jira-sb-brand-btn`, `.jira-sb-brand-text`.
- Uppercase label variant, divider variant, badge (light purple), external-link icon slot, blue square swatch.
- Muted `#44546f` text for normal items; active state uses `#e9d8fd` background with a `#8777d9` left accent border and darker text.