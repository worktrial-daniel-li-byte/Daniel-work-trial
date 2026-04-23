# Dispatch 04 — resumed worker

- **Before reward:** -0.1765
- **After reward:**  -0.3333
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Fix failing spec `tests/calendar/page.load.spec.mjs`. The error is `expect(page).toHaveTitle(expected) failed`.

Step 1: Read the full spec at `tests/calendar/page.load.spec.mjs`. Note:
   - What URL it navigates to (likely /calendar or similar)
   - What title it expects (exact string)
   - What headings / tab links it asserts

Step 2: Run it to see the full error: `npx playwright test tests/calendar/page.load.spec.mjs --reporter=line 2>&1 | tail -40`

Step 3: Look at src/App.tsx — does it have routing for Calendar? Does it change document.title? If the spec asserts `toHaveTitle('…Calendar…')`, we need to set document.title when on the calendar route.

Step 4: Make the minimal changes in src/App.tsx (and src/main.tsx if needed) to:
   - Route to the Calendar view when the spec navigates there
   - Set `document.title` to the exact expected value
   - Render a Calendar heading as an active tab with the sibling tab links visible

Report: the exact URL path and title strings from the spec, and the changes you made.

## Rationale

calendar/page.load failure is specifically `toHaveTitle` — this is a straightforward document.title fix plus basic route rendering. Different subsystem than toolbar fixes so should be clean to address.

## Worker summary

The spec `tests/calendar/page.load.spec.mjs` is already passing (1 passed in 4.4s) — no changes were needed. The calendar route, `document.title = 'Calendar - Jira'`, Space navigation with the active `<h2>Calendar</h2>`, all sibling tab links, and the month heading are all already rendered correctly in the app.
