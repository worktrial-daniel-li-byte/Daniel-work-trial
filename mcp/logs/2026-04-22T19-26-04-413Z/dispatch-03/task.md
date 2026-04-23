# Dispatch 03 — fresh worker

- **Before reward:** 0.0116
- **After reward:**  0.0124
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

In src/App.css, fix the topbar layout so the search bar is CENTERED in the topbar (not left-aligned).

Currently `.jira-topbar__center` has `justify-content: flex-start` and sits right after the brand, making the search input narrow and left-aligned. The reference has a wide search input (~900px) visually centered in the topbar.

Change `.jira-topbar__center` so it:
- has `flex: 1` so it takes all remaining horizontal space between the left group and the right group
- uses `justify-content: center` to center its content
- its child (the search input / wrapper) should have `max-width: 720px` and `width: 100%` so the search bar is wide and centered

Also ensure `.jira-topbar__left` and `.jira-topbar__right` do NOT have `flex: 1` — they should size to their content only (use `flex: 0 0 auto` or just no flex grow).

Only edit src/App.css. Do not change JSX or text.

## Rationale

Centering the wide search bar is a major layout alignment with the reference and should boost SSIM on the whole top ~60px strip.

## Worker summary

Edited src/App.css: changed `.jira-topbar__center` to `flex: 1` with `justify-content: center`, and made the search child use `width: 100%` and `max-width: 720px` so the search bar is wide and centered in the topbar. The `.jira-topbar__left` and `.jira-topbar__right` rules already had no `flex: 1` (only `flex-shrink: 0`), so they size to content as required.
