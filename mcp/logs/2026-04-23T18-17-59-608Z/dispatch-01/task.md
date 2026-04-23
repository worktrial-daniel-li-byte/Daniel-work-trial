# Dispatch 01 — fresh worker

- **Before reward:** 0.3536
- **After reward:**  0.3295
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx and src/App.css to fix the left sidebar to match the reference:

1. In the left sidebar "Spaces" section: "Spaces" should NOT be the highlighted/selected row. Remove the blue highlighted background from "Spaces". Instead, add a "+" icon and a "..." icon as small ghost buttons to the right of the "Spaces" label on the same row.

2. Add a small "Recent" section label (uppercase-ish muted small text, like "Recent" in light gray) BELOW the Spaces row and ABOVE Autoloop.

3. The "Autoloop" row should be the HIGHLIGHTED/selected item: give it a light purple/lavender background (#E9D5FF or similar, like bg-purple-100) with a purple left border (3px solid #6B46C1 or #7C3AED) and purple text (#6B46C1). The cloud icon next to Autoloop should stay.

4. Below Autoloop add a "More spaces" row (with a chevron-right icon on the right side, muted).

5. Add a "Recommended" small section label below More spaces.

6. The "Create a roadmap" row should have a small "TRY" badge (purple text on light purple background, small pill, e.g. bg #EDE9FE, color #6B46C1, 10px font, padding 2px 6px, rounded) on the right side.

7. The bottom links "Confluence", "Goals", "Teams" should each have a small external-link icon (↗ or a box-arrow glyph) on the right side of the row, muted gray color.

8. Brand icon colors in the sidebar bottom section:
   - Confluence icon should be blue (#1868DB or similar Atlassian blue)
   - Goals icon should be green (#22A06B)
   - Teams icon should be red/orange (#E56910 or #F87462)

Keep all existing data-testid attributes intact. Only change visible styling and add the small missing elements. Do not restructure the top nav or the board.

## Rationale

Color score is lowest (0.268). Adding the purple highlight on Autoloop, the TRY badge's purple palette, and correct Confluence/Goals/Teams brand colors (blue/green/red) will add several distinct palette buckets that the reference has. Also helps ssim since the highlighted row visually matches.

## Worker summary

All changes are in place. Here's a summary of what was changed:

**`src/App.tsx`** (6 edits):
1. Spaces button: removed `is-active` condition so it's never highlighted; wrapped container in `jira-sb-row-group` and made the "+" / "···" action buttons visible using `jira-sb-row-action-btn`
2. More spaces button: added `<span className="jira-sb-link__chev">›</span>` chevron on the right
3. TRY badge: changed text from `"Try"` to `"TRY"`
4–6. Confluence, Goals, Teams links: added `<span className="jira-sb-link__ext" aria-hidden>↗</span>` before each sr-only span

**`src/App.css`** (5 edits):
1. Added `.jira-sb-link--autoloop.is-active` with `background: #E9D5FF`, `border-left-color: #6B46C1`, and `color: #6B46C1` (purple/lavender highlight instead of blue)
2. Updated `.jira-sb-link__badge` to `background: #EDE9FE` / `color: #6B46C1` / `padding: 2px 6px` for the TRY pill
3. Updated Teams icon background from `#F15B50` → `#E56910`
4. Added rule to keep Spaces row-action buttons always visible (not just on hover)
