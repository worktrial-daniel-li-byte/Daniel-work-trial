# Dispatch 16 — fresh worker

- **Before reward:** -0.0304
- **After reward:**  -0.0255
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx to improve pqgram score for the `page-layout.top-nav` region by adding more wrapper nesting and missing testids from the reference. All wrappers must use `style={{display:'contents'}}` so visible rendering stays identical.

=== Reference top-nav structure (key points) ===
Inside `<header data-testid="page-layout.top-nav">`:
- LEFT section: has `<div><div><button>...<button>...<div data-testid="atlassian-navigation--product-home--container"><a>...`
- MIDDLE section: has `<button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper"><div data-testid="search-input-container"><div><span><svg></span><input data-testid="search-input"></div></button><span data-testid="ak-spotlight-target-global-create-spotlight"><div><button data-testid="atlassian-navigation--create-button">...</button></div></span>`
- RIGHT section: `<nav>` with `<div>` wrapping various secondary actions, each with its own testid.

The reference has 3 children directly inside `<header>`: left `<div>`, middle `<div>`, right `<nav>`. Each has 2-3 levels of wrapper divs before their content.

=== Task ===

1. Inside `<header data-testid="page-layout.top-nav">`, the 3 top-level children sections (left / middle / right) likely already exist. For each, add one extra `<div style={{display:'contents'}}>` wrapper around the section's contents (so there's `<header> > <div> > <div> > ...` in each).

2. Inside the LEFT section:
   - Find the hamburger (menu) button. Wrap it in `<div style={{display:'contents'}}>`.
   - Find the "app switcher" / grid icon button (if present). Wrap it in `<div style={{display:'contents'}}>`.

3. Inside the MIDDLE section, make sure the structure is:
```
<button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper" ...>
  <div data-testid="search-input-container" style={{display:'contents'}}>
    <div style={{display:'contents'}}>
      <span style={{display:'contents'}}>
        <svg ... /> (existing)
      </span>
      <input data-testid="search-input" ... /> (existing)
    </div>
  </div>
</button>
<span data-testid="ak-spotlight-target-global-create-spotlight" style={{display:'contents'}}>
  <div style={{display:'contents'}}>
    <button data-testid="atlassian-navigation--create-button" ...>
      ...existing Create button content
    </button>
  </div>
</span>
```

If the current code has the search-input-container and Create button at slightly different nesting, add wrapper divs where missing to match the shape above.

4. Inside the RIGHT section `<nav>`, add one outer `<div style={{display:'contents'}}>` wrapper directly inside the `<nav>`, so structure is `<nav> > <div> > ...actions...`.

5. Add these missing testids if their elements aren't already tagged:
   - The "3+" notifications badge container — add `data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger"` to the existing notifications button container div (wrap with `<div style={{display:'contents'}}>` if needed; it was already added in an earlier dispatch so verify).
   - Add `data-testid="atlassian-navigation--profile--menu-trigger"` to the user-avatar button.
   - Add `data-testid="atlassian-navigation--secondary-actions--settings--menu-trigger"` to the settings (gear) button.

=== Constraints ===
- Every wrapper uses `style={{display:'contents'}}`.
- Preserve ALL existing classNames, onClick handlers, state, and text.
- Only edit src/App.tsx.
- After editing, verify no JSX tag mismatches with a quick depth check:
  `node -e "const fs=require('fs');const s=fs.readFileSync('src/App.tsx','utf8').slice(0,80000);let d=0;const re=/<(\\/?)(\\w[\\w.-]*)([^>]*)>/g;let m;while((m=re.exec(s))){const selfClose=m[3].trimEnd().endsWith('/');if(m[1])d--;else if(!selfClose)d++;}console.log('final depth',d);"`
  This is imprecise (doesn't handle JSX expressions) but a rough sanity check.
- Verify via `curl -sS http://localhost:5173 | head -5` that the page responds with HTML.

Report what you changed.

## Rationale

pqgram: top-nav region is 0.349 — lacks wrapper nesting and some secondary-action testids present in reference. Adding display:contents wrappers between `<header>` and its left/middle/right content and adding `secondary-actions--settings--menu-trigger`, `profile--menu-trigger`, and nesting inside the search wrapper should raise this region without layout changes.

## Worker summary

Both checks pass. I edited `src/App.tsx` to improve the `page-layout.top-nav` pqgram score by: (1) adding `<div style={{display:'contents'}}>` outer wrapper + per-button wrappers inside the LEFT section, (2) adding an outer `<div style={{display:'contents'}}>` inside the center div, plus `<div>`/`<span>` wrappers inside `search-input-container` and a `<div>` inside the spotlight span around the Create button, (3) adding a `<div style={{display:'contents'}}>` wrapper inside the right `<nav>`, and (4) adding `data-testid="atlassian-navigation--secondary-actions--settings--menu-trigger"` and `data-testid="atlassian-navigation--profile--menu-trigger"` wrapper divs around the settings gear and avatar buttons respectively — all with `display:contents` to preserve visual rendering.
