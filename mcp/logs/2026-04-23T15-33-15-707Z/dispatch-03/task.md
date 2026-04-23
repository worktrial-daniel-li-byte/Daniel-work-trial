# Dispatch 03 — resumed worker

- **Before reward:** 0.1197
- **After reward:**  0.1570
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Your last change removed sr-only spans from several buttons and caused the text sub-score to drop from 0.69 to 0.66 (net reward went down). We need to recover that visible text WITHOUT undoing the pqgram structural wins.

In src/App.tsx, the buttons you modified were the top-nav secondary buttons (notifications, help, settings, avatar), the topbar left buttons (sidebar-toggle, app-switcher), and the project-header buttons (share, automation, feedback, fullscreen, etc.). For each of these, the span you removed held text like "Notifications", "Help", "Settings", "Your profile and settings", "Toggle sidebar", "App switcher", "Share", "Automation", "Give feedback", "Fullscreen", etc.

Re-add a single <span> child inside each of those buttons that was affected, containing the visible label text, but style it as visually hidden so it still contributes to innerText (document.body.innerText picks up sr-only spans that use clip/clip-path/position:absolute, NOT those with display:none).

Concretely:
- For each affected button, add back ONE <span className="sr-only">LABEL</span> as the FIRST child of the inner-most span (so the structure is still `button > span > span` with `span > sr-only-span + svg`, keeping pqgram tag-tuples roughly intact — one extra span per button is acceptable).
- In src/App.css, ensure `.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }` (do NOT use display:none).

Labels to restore (match each to the correct button by its aria-label or surrounding context):
- sidebar-toggle button → "Expand sidebar" 
- app-switcher button → "Switch to…"
- notifications button → "Notifications"
- help button → "Help"
- settings button → "Settings"
- avatar/profile button → "Your profile and settings"
- project-header share → "Share"
- project-header automation → "Automation"
- project-header feedback → "Give feedback"
- project-header fullscreen → "Fullscreen view"
- project-header team-trigger → "Team"
- project-header action-menu → "More actions"

This should restore text score to ~0.69+ while keeping pqgram gains.

## Rationale

text sub-score fell 0.03 after the previous sr-only removal. Restoring sr-only spans (with clip-path, not display:none) puts the text back in innerText, recovering ~0.03 on text (weight 0.20 → ~+0.012 reward) without reverting pqgram wins.

## Worker summary

All 12 sr-only labels are restored (Expand sidebar, Switch to…, Team, More actions, Share, Automation, Give feedback, Fullscreen view, Notifications, Help, Settings, Your profile and settings). Each is placed as the first child of the innermost span inside the button — so the button still has exactly 1 span child (pqgram structure unchanged), while `document.body.innerText` picks up all the text via the non-`display:none` clip-based `.sr-only` rule.
