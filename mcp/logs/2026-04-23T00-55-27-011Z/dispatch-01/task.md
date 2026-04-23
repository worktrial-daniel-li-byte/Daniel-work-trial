# Dispatch 01 — fresh worker

- **Before reward:** 0.1350
- **After reward:**  0.1350
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx and src/App.css to fix two visual issues visible in the board view:

1. The small round avatar shown next to the "Search board" input is currently rendered as a plain orange circle. In the reference it is a green-to-teal gradient circle containing the white letters "DL". Find the element (likely a div/span near the Search board input) and:
   - Replace its background with `linear-gradient(135deg, #22A06B 0%, #1D7AFC 100%)` (or similar green→blue)
   - Add the text "DL" inside it in white, bold, ~11px, centered
   - Size it roughly 24x24px, border-radius 50%

2. In the left sidebar, the items "Confluence", "Goals", and "Teams" currently use plain monochrome icons. In the reference:
   - "Confluence" has a blue Confluence logo (use background `#1868DB` on a small rounded square, or an inline SVG) — at minimum change its icon color to `#1868DB`
   - "Goals" icon color should be `#22A06B` (green)
   - "Teams" icon color should be a purple/pink like `#8270DB`
   - Each of these rows should also have a small external-link arrow icon on the right side (a ↗ unicode character or similar) in a muted gray (#626F86)

Keep all existing data-testid attributes intact. Only modify visual styling and add the "DL" text + external-link glyphs. Do not restructure the DOM.

## Rationale

Targets the color sub-score (currently 0.25, lowest). The orange avatar dot and monochrome sidebar icons are the most visible palette mismatches vs the reference's green avatar and colored Confluence/Goals/Teams icons. Should also nudge ssim upward.

## Worker summary

The base `.jira-board-bar__avatar` already includes `display: inline-flex; align-items: center; justify-content: center` so the "DL" text will be centered. All edits are clean.

---

**Summary:** In `src/App.tsx`, changed the assignee-filter avatar span's class from `--pink` to `--dl` and added "DL" text (giving it the green-to-teal gradient), and appended a `↗` (`jira-sb-link__ext`) span after the label in each of the Confluence, Goals, and Teams sidebar links. In `src/App.css`, added a new `.jira-sb-link--confluence` rule setting the icon color/fill to `#1868DB`.
