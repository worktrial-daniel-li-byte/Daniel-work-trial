# Dispatch 01 — fresh worker

- **Before reward:** -0.1057
- **After reward:**  -0.1057
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Rewrite the left sidebar in the React app (likely in src/components/Sidebar.tsx or similar — find it) to match the reference Jira sidebar exactly:

1. Remove the radio-circle bullets (○) in front of every item. Each nav item should use a proper icon (an inline SVG or a lucide-react icon) to its left, not a radio/circle input.

2. Top-level nav items (in this order) with these icons:
   - "For you" (user icon)
   - "Recent" (clock icon, with a right chevron ">" on the right side)
   - "Starred" (star icon, with right chevron ">")
   - "Apps" (grid icon)
   - "Plans" (clipboard/bookmark icon)

3. Then a "Spaces" section header row that shows the word "Spaces" on the left and a "+" icon and a "…" (more) icon on the right.

4. Under Spaces, a "Recent" small gray subheading label, then one highlighted item "Autoloop" (with a blue square app icon like a small rounded blue tile — keep current selected purple background). Then a "More spaces" row with a right chevron.

5. A "Recommended" small gray subheading, then:
   - "Create a roadmap" with a small "TRY" badge on the right (light purple background, purple text)
   - "Import work" (cloud-upload icon)

6. Then items: "Filters" (filter icon), "Dashboards" (dashboard/grid icon).

7. Then items with an external-link icon on the right: "Confluence" (with Confluence blue icon), "Goals" (target icon), "Teams" (people icon).

8. Finally a "More" row with a "…" icon on the left.

9. Remove the "Give feedback" and "Enter full screen" items at the bottom — they are not in the reference.

10. Also update the top-left header: it should show a sidebar-toggle icon, an apps-grid icon, then the Jira logo (blue swirl) and the text "Jira" in bold. Currently it shows a generic logo and home icon — replace with those three elements.

Keep the existing purple/lavender color scheme. Use simple inline SVG icons (stroke currentColor, 16-18px) so no new deps are needed. Make sure text labels match exactly (case-sensitive).

## Rationale

Sidebar text labels, icon presence, and removed extra items should boost text score significantly, and restoring proper icons instead of radio dots should push SSIM up too.

## Worker summary

Now I have a full picture. Let me plan the changes:

1. Replace the sidebar item rendering to use per-item icons (map icons by id)
2. Add support for right-side content (chevron for Recent/Starred, TRY badge for create-roadmap, external-link for Confluence/Goals/Teams, etc.)
3. Add "Recent" sub-label under Spaces before Autoloop
4. Add blue app tile icon for Autoloop selected item
5. Remove footer section (Give feedback, Enter full screen)
6. For "More" row, put ellipsis icon on left
7. Update topbar to show sidebar-toggle icon, apps-grid icon, then JiraIcon + "Jira" bold text. Remove home + app-switcher buttons (or restructure).

Let me restructure the sidebar data model. I'll define per-item icon metadata and special props inline.
