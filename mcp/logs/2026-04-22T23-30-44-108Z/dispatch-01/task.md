# Dispatch 01 — fresh worker

- **Before reward:** -0.0167
- **After reward:**  -0.0382
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: Raise the pqgram sub-score by mirroring the reference's DOM structure (tag names, data-testid values, and wrapper-div nesting) inside the sidebar / left-nav region.

Files to read first:
- reference_app/html/reference.html — this is the TARGET DOM. Search for `data-testid="page-layout.sidebar"` and study the subtree rooted at that element. Note every descendant element's TAG, data-testid (if any), and the wrapper-div nesting depth between meaningful elements.
- src/App.tsx — this is what renders our app. Find the sidebar section and update it.
- src/App.css — only touch if needed to preserve layout.

What to do in src/App.tsx:
1) Ensure the sidebar root element has `data-testid="page-layout.sidebar"` on the matching tag (likely <aside> or <nav> — use whatever tag the reference uses).
2) Inside that subtree, mirror the reference as closely as possible:
   - Copy every data-testid value verbatim onto the matching element with the same tag name.
   - Match the wrapper-div nesting depth — if the reference wraps a list in <div><div><nav><ul>…, reproduce that chain of wrapper divs.
   - Preserve all current visible text ("For you", "Recent", "Starred", "Apps", "Plans", "Spaces", "Autoloop", "More spaces", "Recommended", "Create a roadmap", "TRY", "Import work", "Filters", "Dashboards", "Confluence", "Goals", "Teams", "More") so the text sub-score doesn't drop.
3) Do NOT change colors, sizes, or visible copy. Only restructure tags/testids/wrappers.

After editing, list the data-testid values you emitted and the top-level tag hierarchy you produced in your summary so I can verify.

## Rationale

pqgram: left-nav region currently 0.25. Mirroring the reference's data-testid labels and wrapper-div depth inside the sidebar subtree will raise that region's pq-gram Dice score and also boost the 'whole' tree score (sidebar is a large subtree), lifting pqgram.combined.

## Worker summary

All visible text is preserved. 

I edited `src/App.tsx`, replacing the sidebar render block (lines 1763–1991) with a restructured version that:

**data-testid values emitted:**
- `page-layout.sidebar` (nav, + `aria-label="Sidebar"`)
- `NAV4_for-you-container` (div, D06)
- `NAV4_for-you` (button, D07)
- `NAV4_jira.sidebar.apps-container` (div, D08)
- `NAV4_jira.sidebar.apps` (button, D09)
- `NAV4_jira.sidebar.plans-container` (div, D08) ← was `NAV4_plans-container`
- `NAV4_jira.sidebar.plans` (button, D09) ← was `NAV4_plans`
- `NAV4_jira.sidebar.projects-container` (div, D08) ← new
- `NAV4_jira.sidebar.projects` (button, D09) ← new
- `navigation-apps-sidebar-nav4-sidebars-content-projects-core.common.ui.content.recent-section.recent-section` (div[role=listitem])
- `NAV4_proj_AUT-container` (div)
- `NAV4_jira.sidebar.filters-container` (div, D09 inside projects) ← was `NAV4_filters-container`
- `NAV4_jira.sidebar.filters` (button, D10) ← was `NAV4_filters`
- `NAV4_jira.sidebar.dashboards-container` (div, D09) ← was `NAV4_dashboards-container`
- `NAV4_jira.sidebar.dashboards` (button, D10) ← was `NAV4_dashboards`
- `navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger` (per-section more-actions buttons)
- `side-nav-recommendation.jira-side-nav` (div, D03) ← new
- `sidebar-entry.panel-splitter-container` / `sidebar-entry.panel-splitter-tooltip--container` / `sidebar-entry.panel-splitter` (now inside `<nav>`)

**Top-level tag hierarchy produced:**
```
nav[page-layout.sidebar, aria-label=Sidebar]
  div (D01, display:contents)
    div.jira-sidebar__scroll (D02)
      div (D03, display:contents)
        div[role=list] (D04)
          div[role=listitem] → div[NAV4_for-you-container] → button[NAV4_for-you]
          div[role=listitem] → div → button (Recent, no testid)
          div[role=listitem] → div → button (Starred, no testid)
          div[role=listitem] → div → div → div[NAV4_jira.sidebar.apps-container] → button[NAV4_jira.sidebar.apps]
          div[role=listitem] → div → div → div[NAV4_jira.sidebar.plans-container] → button[NAV4_jira.sidebar.plans]
          div[role=listitem] (projects wrapper containing all remaining):
            → div → div → div[NAV4_jira.sidebar.projects-container] → button[NAV4_jira.sidebar.projects]
            → div[role=list] → div[role=listitem,recent-section] → div[role=group] → div[role=list]
                → div[role=listitem] → div[NAV4_proj_AUT-container] → button (Autoloop)
                → div[role=listitem] → button (More spaces)
            → div[role=listitem] → div → div → div[NAV4_jira.sidebar.filters-container] → button[NAV4_jira.sidebar.filters]
            → div[role=listitem] → div → div → div[NAV4_jira.sidebar.dashboards-container] → button[NAV4_jira.sidebar.dashboards]
            → div (spacer)
            → div[role=list] → span → div[role=listitem] → button (Confluence/Goals/Teams)
            → div (spacer)
            → div[role=listitem] → div → div → button (More)
      div[side-nav-recommendation.jira-side-nav] (D03, Recommended section)
  div (D01, display:contents) → div[sidebar-entry.panel-splitter-container]
```
