# Dispatch 06 — fresh worker

- **Before reward:** -0.0651
- **After reward:**  -0.0470
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Edit src/App.tsx to add more data-testid attributes and small structural fixes to improve pqgram matching. These are additive and should not change visible rendering.

=== 1. Top nav region (`page-layout.top-nav`) ===

The top nav is a `<header data-testid="page-layout.top-nav">` containing three sections: left (hamburger + logo), middle (search + create), right (Rovo + notifications + settings + help + avatar).

Apply these changes inside the <header>:

a) **Product home container**: find the Jira logo `<a>` (the link wrapping the Jira icon + "Jira" text) in the LEFT section. Wrap it (only the `<a>`, nothing else) in a `<div data-testid="atlassian-navigation--product-home--container">`. The div must use `style={{display:'contents'}}` so no layout changes.

b) **Search wrapper**: find the MIDDLE section's search-input container (the div that contains the magnifying-glass svg + the `<input>` with placeholder "Search"). Currently it's something like:
   ```
   <div>
     <div>
       <span><svg/></span>
       <input ... />
     </div>
     <button>Create</button>
   </div>
   ```
   Change the inner `<div>` that wraps the svg+input to `<div data-testid="search-input-container">` and add `data-testid="search-input"` to the `<input>` element.

c) **Quickfind skeleton wrapper**: wrap the `<div data-testid="search-input-container">` (from step b) in a `<button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper" type="button" style={{all:'unset',display:'contents'}}>`. The `display:contents` style means the button contributes no box to layout.

d) **Create button testid + spotlight**: find the blue "Create" button in the top nav. Add `data-testid="atlassian-navigation--create-button"` to it. Wrap it in a `<span data-testid="ak-spotlight-target-global-create-spotlight" style={{display:'contents'}}>`.

e) **Right section tag**: in the RIGHT group (Rovo / notifications / settings / help / avatar), change the outer wrapper `<div>` to `<nav>`. Keep all children/classes identical.

f) Inside the right section, add these testids to the existing elements:
   - The "Ask Rovo" button or chip → wrap in `<span data-testid="atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate" style={{display:'contents'}}>`.
   - The notifications bell button → wrap in `<div data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger" style={{display:'contents'}}>`.
   - The help (?) button → wrap in `<div data-testid="atlassian-navigation--secondary-actions--help--menu-trigger" style={{display:'contents'}}>`.

=== 2. Board toolbar region (`business-filters.ui.filters.assignee-filter`) ===

The fieldset currently looks like:
```
<fieldset data-testid="business-filters.ui.filters.assignee-filter" className="...">
  <button data-testid="business-filters.ui.filters.trigger.button-wrapper">...</button>
  <span data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">...</span>
</fieldset>
```

Restructure to match the reference. The reference's `<fieldset>` contains ONLY: `<legend>`, then `<div>` > `<div>` > `<input>` + `<div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">`. The trigger button is OUTSIDE the fieldset (as its sibling in the same toolbar row).

So do this:

a) Move the `<button data-testid="business-filters.ui.filters.trigger.button-wrapper">...</button>` OUT of the fieldset — make it a sibling of the fieldset (place it immediately after the fieldset in the same parent container).

b) Replace the children of the `<fieldset data-testid="business-filters.ui.filters.assignee-filter">` with:
   ```jsx
   <legend style={{display:'none'}}>Assignee</legend>
   <div style={{display:'contents'}}>
     <div style={{display:'contents'}}>
       <input type="hidden" readOnly value="" aria-hidden="true" style={{display:'none'}} />
       <div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">
         {/* move the existing <span>DL avatar</span> contents here, or whatever currently renders the avatar */}
         <div style={{display:'contents'}}><span style={{display:'contents'}}><img alt="" src="/avatar-dl.png" style={{display:'none'}} /></span></div>
         <span style={{display:'contents'}}><span style={{display:'contents'}}><div style={{display:'contents'}}>{/* EXISTING avatar JSX here — move the current visible avatar rendering here */}</div></span></span>
       </div>
     </div>
   </div>
   ```
   The critical thing: the original visible avatar content must be preserved exactly (so the screenshot doesn't change), but it must now be inside the nested `div > span > span > div` structure inside the `presence-filter-avatar` div.

If the current avatar is rendered as e.g. `<span className="av-DL">DL</span>` inside the old `<span data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">`, keep that exact element but move it to be the child of the innermost display:contents div in the new structure, and change the outer element to `<div data-testid="...">` instead of `<span data-testid="...">`.

=== 3. Banner ===

At the very beginning of the `<div data-testid="page-layout.root">`, before the top-nav header, add an empty banner div:
```jsx
<div data-testid="page-layout.banner" style={{display:'contents'}}></div>
```

=== Constraints ===

- No visible change permitted. All structural wrapper divs/spans/buttons must use inline `style={{display:'contents'}}` (or `display:'none'` for truly hidden inputs).
- Do not remove any existing text, className, onClick, or child elements — wrap/re-parent only.
- Only edit src/App.tsx.

Report each edit with the file-line where it was applied, and re-run `curl http://localhost:5173` if useful to confirm no syntax errors.

## Rationale

pqgram: adds ~10 missing testids across top-nav (6 testids + right-section tag `div`→`nav`) and fixes the board-toolbar fieldset's internal structure + moves the trigger button to be a sibling. These directly raise the `top-nav`, `board-toolbar`, and `app-shell` region scores and the `whole` score.

## Worker summary

All 13 new testids/structural changes are present. TypeScript compilation passes cleanly. I edited `src/App.tsx` to: (1) add `<div data-testid="page-layout.banner">` before the header, (2) wrap the brand logo in `atlassian-navigation--product-home--container`, (3) add `data-testid="search-input-container"` and `data-testid="search-input"` to the top-nav search area and wrap it in the quickfind-skeleton-wrapper button, (4) add `data-testid="atlassian-navigation--create-button"` to the Create button and wrap it in the spotlight span, (5) change the right section `<div>` to `<nav>`, (6) wrap the Rovo button, notifications div, and help button with their respective testid wrappers, and (7) restructure the board-toolbar fieldset so it contains `<legend>` + nested divs with the presence-filter-avatar div, and move the trigger button to be a sibling after the fieldset.
