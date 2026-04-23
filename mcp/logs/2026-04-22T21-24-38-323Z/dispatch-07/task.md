# Dispatch 07 — fresh worker

- **Before reward:** -0.0470
- **After reward:**  -0.1353
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Edit src/App.tsx to fix the horizontal navigation structure to match the reference DOM. All changes must preserve the current visible rendering exactly (use display:contents on inserted wrapper elements).

=== Current state (GEN) ===
Currently, in the project area, the structure is:
```
<div data-testid="horizontal-nav-header.ui.project-header.header">
  ... project header content (breadcrumb + Autoloop title + icons) ...
  <nav data-testid="horizontal-nav.ui.content.horizontal-nav">
    ... tab buttons (Summary / Board / List / etc.) ...
  </nav>
</div>
```

=== Target state (REF) ===
The reference has them INVERTED and the horizontal-nav is a `<header>` that WRAPS the project-header:
```
<header data-testid="horizontal-nav.ui.content.horizontal-nav">
  <div>
    <div>
      <div>
        <div>
          <nav>{/* breadcrumb */}</nav>
          <div data-testid="horizontal-nav-header.ui.project-header.header">
            ... project header content ...
          </div>
        </div>
      </div>
    </div>
    <nav>{/* tabs */}
      <ul>
        <li><a data-testid="navigation-kit-ui-tab.ui.link-tab">Summary</a></li>
        <li><a data-testid="navigation-kit-ui-tab.ui.link-tab">Board</a></li>
        ... one <li><a> per tab ...
      </ul>
    </nav>
  </div>
</header>
```

=== Task ===

1. Find the JSX block that renders `<nav data-testid="horizontal-nav.ui.content.horizontal-nav">` inside the `<div data-testid="horizontal-nav-header.ui.project-header.header">`.

2. Restructure so the outer element becomes a `<header data-testid="horizontal-nav.ui.content.horizontal-nav">` (change tag from `<nav>` to `<header>`, keep the same data-testid).

3. Move the project-header div so it is nested inside the horizontal-nav `<header>`. Specifically: inside the `<header data-testid="horizontal-nav.ui.content.horizontal-nav">`, the first child should be a `<div style={{display:'contents'}}>` that contains the project-header div. After that, include the tabs nav.

4. The tab buttons (Summary / Board / List / Calendar / Timeline / Approvals / Forms / Pages / More) are currently rendered as `<button>` or `<span><button>` elements inside the nav. Convert them to an `<ul style={{display:'contents', listStyle:'none', margin:0, padding:0}}>` containing one `<li style={{display:'contents'}}>` per tab, and inside each `<li>` wrap the existing button (unchanged) with an `<a data-testid="navigation-kit-ui-tab.ui.link-tab" style={{display:'contents'}} href="#" onClick={e=>e.preventDefault()}>`.

   Do NOT remove the existing tab buttons or their onClick/state logic. Just wrap each existing `<button>` (or `<span><button>`) in `<li><a data-testid="navigation-kit-ui-tab.ui.link-tab">...</a></li>` and put them all inside a `<ul>`.

5. The tabs should remain inside a `<nav style={{display:'contents'}}>` element (so the reference's `<header> > ... > <nav><ul>...</ul></nav>` shape is present).

6. Add the extra wrapper divs to match reference's depth. Specifically, between `<header data-testid="horizontal-nav.ui.content.horizontal-nav">` and the project-header div, insert FOUR nested `<div style={{display:'contents'}}>` wrappers.

=== Constraints ===
- All inserted wrappers must use `style={{display:'contents'}}` so layout is unchanged.
- Preserve every existing className, onClick, state variable, and visible text.
- Do NOT remove existing DOM elements — wrap, re-parent, or retag only.
- Only edit src/App.tsx.

=== Verification ===
After editing, the DOM should look like this (with display:contents on all extra wrappers):
```
<header data-testid="horizontal-nav.ui.content.horizontal-nav">
  <div>           ← 1st wrapper
    <div>         ← 2nd
      <div>       ← 3rd
        <div>     ← 4th
          <div data-testid="horizontal-nav-header.ui.project-header.header">
            ...existing project-header content (Autoloop title etc.)...
          </div>
        </div>
      </div>
    </div>
    <nav>
      <ul>
        <li><a data-testid="navigation-kit-ui-tab.ui.link-tab">{existing Summary button}</a></li>
        <li><a data-testid="navigation-kit-ui-tab.ui.link-tab">{existing Board button}</a></li>
        ...
      </ul>
    </nav>
  </div>
</header>
```

Report the line numbers of the key edits and confirm no TypeScript errors via `npx tsc --noEmit` or the Vite HMR log.

## Rationale

pqgram: fixes inverted nesting of `horizontal-nav.ui.content.horizontal-nav` and `horizontal-nav-header.ui.project-header.header`, changes the outer tag from `<nav>` to `<header>` as in reference, and adds the `<ul><li><a data-testid="navigation-kit-ui-tab.ui.link-tab">` tab structure. This should meaningfully raise both `horizontal-nav` and `project-header` region scores and `whole`.

## Worker summary

The structure is correct and TypeScript compiles cleanly. I edited `src/App.tsx` to: (1) replace the outer `<div data-testid="horizontal-nav-header.ui.project-header.header">` with a `<header data-testid="horizontal-nav.ui.content.horizontal-nav">` wrapping 4 `display:contents` divs then the project-header div; (2) removed the old `<nav data-testid="horizontal-nav.ui.content.horizontal-nav">` from inside the project-header; and (3) after the project-header's closing `</div>`, added closing tags for the 3 inner wrappers followed by a new `<nav style={{display:'contents'}}><ul><li><a data-testid="navigation-kit-ui-tab.ui.link-tab">` structure wrapping each existing tab button, then closed the 1st wrapper `</div>` and `</header>`.
