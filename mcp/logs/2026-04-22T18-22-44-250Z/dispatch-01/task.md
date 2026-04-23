# Dispatch 01 — fresh worker

- **Before reward:** -0.1057
- **After reward:**  -0.1057
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

In src/App.tsx, find the tabs row that currently renders tabs like "Summary, Board, List, Calendar, Timeline, Approvals, Forms, Pages, Attachments, Reports, Archived work items, Shortcuts". Replace the tab list so it renders EXACTLY these tabs in this order: "Summary", "Board", "List", "Calendar", "Timeline", "Approvals", "Forms", "Pages", and then a "More" tab with a small pill/badge showing the number "4" next to it (like "More 4"). Keep "Board" as the active/selected tab (underlined). After the "More 4" tab, keep the existing "+" add-tab button. Do not change any other part of the page.

## Rationale

Reference shows tabs ending at "More 4" not "Attachments/Reports/Archived work items/Shortcuts". Fixing this will raise the text sub-score.

## Worker summary

I need to update the TABS list and the tab render to include a "More" tab with a badge "4". I'll change TABS to only include the 8 visible tabs, then render a separate "More 4" tab button after the map.

Key considerations:

- The `Tab` type derives from TABS. If I remove Attachments/Reports/Archived work items/Shortcuts, the `PlaceholderTab` tab prop still uses `Tab` — that's fine since we still have Calendar/Timeline/Approvals/Forms/Pages.
- activeTab is 'Board' (already default). I'll keep that.
- I need to render a non-interactive or interactive "More" tab with a count badge. The task says "keep 'Board' as the active/selected tab" — so More is not active. I'll make it a button that flashes a message (to stay consistent with the "+" add-tab button behavior).

Let me make the minimal edit: