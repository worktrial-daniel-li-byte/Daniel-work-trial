# Dispatch 13 — resumed worker

- **Before reward:** -0.0423
- **After reward:**  -0.9699
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx to improve the pqgram score for the `page-layout.sidebar` region. All wrappers must use `style={{display:'contents'}}` so visible rendering doesn't change.

=== Current state ===
```
<nav data-testid="page-layout.sidebar">
  <div><div>
    <ul>
      <li><div data-testid="NAV4_for-you-container"><button data-testid="NAV4_for-you">...</button></div></li>
      <li><div data-testid="NAV4_recent-container"><button data-testid="NAV4_recent">...</button></div></li>
      ...etc for starred, apps, plans, spaces (or similar), filters, dashboards, more...
    </ul>
  </div></div>
</nav>
```

=== Reference structure ===
```
<nav data-testid="page-layout.sidebar">
  <div><div><div>
    <div>                            ← section 1: NAV4 items grouped
      <div data-testid="NAV4_for-you-container">
        <a data-testid="NAV4_for-you">...</a>   ← NB: reference uses <a>, not <button>
      </div>
      ...
    </div>
    <div>                            ← section 2: apps + spaces
      <div><div data-testid="NAV4_jira.sidebar.apps-container">
        <button data-testid="NAV4_jira.sidebar.apps">...</button>
        ...
        <button data-testid="...more-nav-menu-button-trigger">More</button>
      </div></div>
    </div>
  </div></div>
</nav>
```

Key differences:
1. REF uses plain `<div>` containers (not `<ul>/<li>`) for the nav items.
2. REF uses an extra wrapper: `<nav><div><div><div>...`  whereas GEN uses `<nav><div><div>...` (one less div).
3. REF has 2 grouping `<div>`s inside splitting NAV4 items into two sections.

=== Task ===

1. Add ONE extra `<div style={{display:'contents'}}>` wrapper directly inside `<nav data-testid="page-layout.sidebar">` (so it's `nav > div > div > div > ...` instead of `nav > div > div > ...`).

2. Find the `<ul>` that contains the sidebar items (the one containing the `<li>`s for For you / Recent / Starred / Apps / Plans / Spaces section / Recommended section / Filters / Dashboards / More). Add `style={{display:'contents'}}` to that `<ul>` so it contributes no box — layout unchanged, but the `<ul>` tag still appears.

   WAIT — actually the `<ul>` and `<li>` tags are a net LOSS for pqgram because reference doesn't have them. Better: replace the `<ul>` with `<div style={{display:'contents'}}>` and each `<li>` with `<div style={{display:'contents'}}>`. This way the sidebar is `<nav> > <div> > <div> > <div> > <div> > <div data-testid="NAV4_for-you-container">...` which closely matches REF.

3. Insert an inner grouping `<div style={{display:'contents'}}>` that wraps the FIRST GROUP of sidebar items (For you, Recent, Starred, Apps, Plans) and a second `<div style={{display:'contents'}}>` that wraps the bottom group (Filters, Dashboards, More and any other). If the current code has the Spaces section between them, leave Spaces in its own div inside the appropriate group — or put it in the top group.

4. Keep ALL existing classNames, onClick handlers, state, and visible labels. Just swap tags ul→div and li→div (add display:contents). Do NOT change visible rendering.

=== 5. Additional sidebar NAV4 items ===

If the Spaces section exists (text "Spaces" followed by the space list), add to that section:
- Wrap the "Spaces" label container (or the whole spaces-section root) in `<div data-testid="NAV4_spaces-container" style={{display:'contents'}}>`.

If there are Recommended items (e.g., "Create a roadmap", "Import work"), wrap each in `<div data-testid="NAV4_recommended-item-container" style={{display:'contents'}}><button data-testid="NAV4_recommended-item">...</button></div>`.

=== Constraints ===
- Only edit src/App.tsx.
- All inserted wrappers and tag-swaps MUST use `style={{display:'contents'}}` so the sidebar looks identical.
- Preserve every className, onClick, state, and text.

Report what you changed.

## Rationale

pqgram: left-nav region is 0.145 because the sidebar uses `<ul>/<li>` tags foreign to the reference tree which has `<div>` containers. Replacing ul→div and li→div (both with display:contents) and adding a grouping wrapper should raise left-nav significantly and contribute to `whole`.

## Worker summary

No TypeScript errors. Edited `src/App.tsx` with three groups of changes to the sidebar: (1) wrapped the entire `<div className="jira-sidebar__scroll">` in a new `<div style={{display:'contents'}}>` to add the extra nesting level matching `nav>div>div>div`; (2) split the single `SIDEBAR_SECTIONS.map` into two explicit `slice(0,5)` and `slice(5)` maps each wrapped in a `<div style={{display:'contents'}}>` to create the two reference grouping sections; and (3) replaced the `<ul>` with `<div style={{display:'contents'}}>` and each `<li>` with `<div style={{display:'contents'}}>` in both the existing first-group map and the new second-group map, eliminating the `ul`/`li` tags foreign to the reference tree.
