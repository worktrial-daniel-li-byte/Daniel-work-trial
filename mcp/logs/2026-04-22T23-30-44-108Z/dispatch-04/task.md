# Dispatch 04 — fresh worker

- **Before reward:** -0.0179
- **After reward:**  -0.0150
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Context: I'm iteratively raising the pqgram DOM-structure score against reference_app/html/reference.html. The app is rendered by src/App.tsx. Class names don't matter — only tag names and data-testid values do. All visible body text must remain unchanged.

Current pqgram region scores (higher = better, max 1.0):
- modal-portal: 0.18 ← lowest, biggest gap to close
- left-nav: 0.33
- top-nav: 0.45
- board-canvas: 0.48
- horizontal-nav: 0.49
- project-header: 0.51
- rovo-fab: 0.63
- board-toolbar: 0.76
- whole tree: 0.48

Please tackle these two regions this dispatch:

=== REGION 1: modal-portal (selector: `body > .atlaskit-portal-container`) ===
In reference_app/html/reference.html, search for elements that are CHILDREN of <body> whose class contains "atlaskit-portal-container". There are usually multiple — one per portal layer. Study the structure: for each one, note the tag (div), the class ("atlaskit-portal-container"), and the entire subtree of tags + data-testid attributes + wrapper-div depth inside.

Then, in src/App.tsx, add the matching portal container elements as **direct children of <body>** (not nested inside the app root). The simplest way: use React's `createPortal` from `react-dom`, targeting `document.body`, OR render plain `<div className="atlaskit-portal-container">` elements inside a React effect that appends them to document.body. If that's too invasive, you can instead render them as direct children of `#root` but with a className including "atlaskit-portal-container" — the selector `body > .atlaskit-portal-container` will NOT match that though, so the pqgram region will stay 0.18. You MUST get them as direct body children.

Strategy I recommend: in src/main.tsx (or src/App.tsx via a useEffect), append N empty `<div class="atlaskit-portal-container">` nodes to document.body matching what the reference has. If the reference's portal containers contain specific subtrees (e.g. tooltips, layers), mirror those inner tags + data-testids too.

=== REGION 2: top-nav ===
In reference_app/html/reference.html, find `data-testid="page-layout.top-nav"` and study its subtree: tags, data-testids (look for things like `atlassian-navigation`, `atlassian-switcher`, `global-create-button`, `search.input`, `atlassian-navigation.help`, `atlassian-navigation.notifications`, `atlassian-navigation.settings`, `atlassian-navigation.profile`, `atlassian-navigation.premium-trial`, `ask-rovo`, etc. — copy exact strings). Wrapper-div depths matter.

In src/App.tsx, locate the top navigation bar (contains Jira logo, search input, Create button, Premium trial, Ask Rovo, notifications, help, settings, avatar). Confirm it's a `<header data-testid="page-layout.top-nav">` (or whatever TAG the reference uses). Then add every descendant data-testid verbatim on the matching tag; mirror wrapper-div nesting depth.

Visible text in the top nav must remain exactly: "Jira", "Search", "Create", "Premium trial", "Ask Rovo", "3+" (the notification badge), "DL" (avatar initials).

In your summary, report:
1) How many `atlaskit-portal-container` divs you emitted and by what mechanism (portal vs direct DOM append vs static JSX child of body).
2) The top-nav root tag + every data-testid you added inside it, with their tags.

## Rationale

pqgram: modal-portal region at 0.18 is the single biggest gap — the reference has `body > .atlaskit-portal-container` anchors we're missing entirely. Emitting them raises that region from near-floor to much higher. Top-nav at 0.45 is also below average and contains many testid'd children we can mirror to raise both the region score and the whole-tree score.

## Worker summary

The order now matches the reference exactly: notifications → help → settings → profile. Here's a summary of what I changed in `src/App.tsx`:

**Modal-portal**: The `createPortal` rendering 1 `div.atlaskit-portal-container` with 7 `div.atlaskit-portal` children (each containing `div[data-theme][data-color-mode][data-subtree-theme] > div[data-vc-oob]`) directly to `document.body` was already present — no structural changes needed.

**Top-nav** — three fixes applied:
1. Added `data-testid="atlassian-navigation--product-home--icon--wrapper"` on the `<span className="jira-sb-brand-logo">` inside the product-home container.
2. Swapped the order of help and settings blocks so help (`atlassian-navigation--secondary-actions--help--menu-trigger`) now precedes settings (`atlassian-navigation--secondary-actions--settings--menu-trigger`), matching the reference.
3. Moved the profile testid from the outer `<div>` to the inner `<button>`, and corrected it from `atlassian-navigation--profile--menu-trigger` to `atlassian-navigation--secondary-actions--profile--trigger`.
