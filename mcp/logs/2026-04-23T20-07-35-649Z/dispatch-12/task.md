# Dispatch 12 — fresh worker

- **Before reward:** 0.3449
- **After reward:**  0.3449
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Investigative task. Read reference_app/html/reference.html and report the EXACT nested element structure (tag names + data-testid attributes only) inside these two regions. Keep the report compact — for each region, show a tree like:

    div[data-testid="horizontal-nav.ui.content.horizontal-nav"]
      div
        nav
          ul
            li
              button[data-testid="horizontal-nav.ui.tabs.board-tab"]
                span
                  span
                    "Board"
      ...

Do this for:

1. The `horizontal-nav` region — everything inside the element with `data-testid="horizontal-nav.ui.content.horizontal-nav"`. Include the first ~40 descendant elements with their tag names and any data-testid values. Strip classNames.

2. The `board-toolbar` region — everything inside `data-testid="business-filters.ui.filters.assignee-filter"` AND its sibling elements in the same toolbar row (scan maybe 30 elements forward from there too, since the rubric anchors on that testid but scores the subtree).

Helpful approach: use a short Node script (no deps) that parses with a regex or with jsdom (if available). Something like:

    node -e "
    const fs=require('fs');
    const h=fs.readFileSync('reference_app/html/reference.html','utf8');
    // find index of testid occurrence and print next 4000 chars
    const i = h.indexOf('horizontal-nav.ui.content.horizontal-nav');
    console.log(h.slice(i-50, i+6000));
    "

Then manually distill that snippet into a tag+testid tree (ignore classes, ignore pure text nodes except trailing ones).

Do NOT edit any source files. Report the two trees in your summary.

## Rationale

To raise pqgram (currently 0.62 combined, with horizontal-nav=0.53 and board-toolbar=0.56), I need to know the exact wrapper-div + data-testid structure in the reference. Next dispatch will then mirror it in src/App.tsx.

## Worker summary

No files were edited. Here are the two reference structural trees:

---

## 1. `horizontal-nav` region

```
header[data-testid="horizontal-nav.ui.content.horizontal-nav"]
  div                                           ← grid wrapper
    div
      div
        div
          nav                                   ← Breadcrumbs
            ol
              li
                a
                  span
      div[data-testid="horizontal-nav-header.ui.project-header.header"]
        div                                     ← project icon + title + action buttons
          div
            div
              div
                img[data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image"]
        div
          form[role="presentation"]
            div
              div
                button
                div[role="presentation"]
                  div
                    h1
                      div[data-testid="horizontal-nav-header.common.ui.read-view"]
        div
          div
            button[data-testid="team-button-trigger"]
              span
          div
            div[role="presentation"]
              button[data-testid="navigation-project-action-menu.ui.themed-button"]
                span
                  span[role="img"]
        div                                     ← share / feedback / fullscreen
          button
            span
              span[role="img"]
          div[role="presentation"]
            button
              span
                span[role="img"]
          div[role="presentation"]
            span
              button[data-testid="feedback-button.horizontal-nav-feedback-button"]
                span
                  span
                  span
          span
            button[data-testid="platform.ui.fullscreen-button.fullscreen-button"]
              span
                span
                span
    nav                                         ← Space navigation (tab list)
      ul
        li
          div
            div
              div
                div
                  a[data-testid="navigation-kit-ui-tab.ui.link-tab"][role="link"]
                    div
                      span
                    span
                  div
                    span
                      button
                        span
                          span
                          span
        li                                      ← (×1) non-interactive tab
          div
            div
              div
                div
                  h2[data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab"]
                    div
                      span
                    span
                  div
                    span
                      button
                        span
                          span
                          span
        li (×5 more)                            ← same a[link-tab] pattern as first li
          ...
        div                                     ← odd stray li wrapper
          li
            div
              div
                div
                  div
                    a[data-testid="navigation-kit-ui-tab.ui.link-tab"]
                      div
                        span
                      span
                    div
                      span
                        button
                          span
                            span
                            span
      div                                       ← "More" overflow trigger
        div
          div
            div
              div[data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button"]
                button[data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab"]
                  div
                    div
                      span
                        span
                          span
      div                                       ← "Add tab" trigger
        div
          div[role="presentation"]
            button[data-testid="navigation-kit-add-tab.ui.trigger"]
              span
                span[role="img"]
```

---

## 2. `board-toolbar` region (from `assignee-filter` and its siblings)

The `fieldset[data-testid="business-filters.ui.filters.assignee-filter"]` lives inside the following wrapper chain (the whole toolbar row):

```
div                         ← page-layout.main content area
  div
    div
      div
        div
          div               ← left side: search + assignee + filter button
            div[role="presentation"]      ← search box container (max-width:184px)
              div
                span
              input          ← aria-label="Search board"
            span[role="status"]           ← "Showing all work items"
            fieldset[data-testid="business-filters.ui.filters.assignee-filter"]
              legend
              div
                div
                  input      ← checkbox (assignee)
                  div[data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar"]
                    div
                      span
                        img
                      span
                        span[role="presentation"]
                          div
            button[data-testid="business-filters.ui.filters.trigger.button-wrapper"]
              span
                div
                  div
                    span       ← "Filter" label
              span
                span
          div                ← right side: group-by + view-settings + more-actions
            button           ← "Group: Status"
              span
            span
              button         ← "View settings"
                span
                  span
                  span
            div
              div
            div
              span
                button       ← "More actions"
                  span
                    span
                    span
```

**Key structural facts for pqgram:**
- The **nav tab list** wraps each tab in 4 nested divs before the `<a>` (or `<h2>`): `li > div > div > div > div > a[link-tab]`. The active/current tab is `h2[data-testid="...non-interactive-tab"]` (no `<a>`).
- The **toolbar row** is: outer `div > div > div > div > div` → then two sibling children: (1) a `div` containing search `div[role="presentation"] + span[role="status"] + fieldset[assignee-filter] + button[filter-trigger]`; (2) a `div` containing group-by button + view-settings button + more-actions button.
- No `board-toolbar` testid exists in the reference; the rubric anchors on `fieldset[data-testid="business-filters.ui.filters.assignee-filter"]` and scores the surrounding subtree.
