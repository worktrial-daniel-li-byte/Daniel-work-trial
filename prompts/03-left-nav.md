# 03 — Left navigation (sidebar)

Align the left-hand sidebar so it sits at the same landmark / test-id
contract as real Jira's `page-layout.sidebar`.

Surface id: `left-nav`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `<aside className="jira-sidebar">`
block (currently around lines 302–328).

## Reference structure

The reference uses a `<nav>` (not `<aside>`) as the sidebar landmark:

```startLine:endLine:reference.html
<nav id="_R…_"
     data-layout-slot="true"
     aria-label="Sidebar"
     style="--n_sNvw:clamp(240px, 309px, 50vw)"
     data-testid="page-layout.sidebar"
     class="_nd5l1b6c _191wglyw _t51zglyw _bfhk1bhr _16qs130s _vchhusvi _4t3ieqxy _152timx3 _kqsw1if8 _1bsb1ego _1pbycs5v _14b5hc79 _qilnk0mc _p5clia51 _4ap3vuon _scbpglyw _1e0cglyw _dm2518uv _15yekb7n _65m41mrw">
  <!-- …product switcher, more-nav buttons, sections, panel splitter… -->
  <div data-testid="side-nav-recommendation.jira-side-nav">…</div>
  <div data-testid="sidebar-entry.panel-splitter-container">
    <div data-testid="sidebar-entry.panel-splitter-tooltip--container" role="presentation">…</div>
    <div data-testid="sidebar-entry.panel-splitter" draggable="true">…</div>
  </div>
</nav>
```

The sidebar contains many `<button data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger">`
(5 of them in the reference) and a `<div role="listitem" data-testid="navigation-apps-sidebar-nav4-sidebars-content-projects-core.common.ui.content.recent-section.recent-section">`.

## Must-preserve contract

- Tag is `<nav>`, not `<aside>`.
- Attributes: `aria-label="Sidebar"`, `data-testid="page-layout.sidebar"`,
  `data-layout-slot="true"`, `id` matching `^_R[a-zA-Z0-9]+_$`.
- Inline `style` includes a `--n_sNvw` CSS custom property (width
  contract). Keeping the exact expression is preferred; at minimum the
  custom property must be present.
- Descendants (must each exist at least once inside the `<nav>`):
  - `[data-testid="side-nav-recommendation.jira-side-nav"]`
  - `[data-testid="sidebar-entry.panel-splitter-container"]`
  - `[data-testid="sidebar-entry.panel-splitter"][draggable="true"]`
  - `[data-testid="sidebar-entry.panel-splitter-tooltip--container"][role="presentation"]`
- At least one `<button data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger">`
  exists (between 1 and 10 acceptable; the reference has 5).

## Class tokens required on the `<nav>`

`_nd5l1b6c _191wglyw _t51zglyw _bfhk1bhr _16qs130s _vchhusvi _4t3ieqxy _152timx3 _kqsw1if8 _1bsb1ego _1pbycs5v _14b5hc79 _qilnk0mc _p5clia51 _4ap3vuon _scbpglyw _1e0cglyw _dm2518uv _15yekb7n _65m41mrw`

Keep your `jira-sidebar` class too so existing CSS continues to style it.

## Volatile bits preserved by shape

- `<nav id>` matches `^_R[a-zA-Z0-9]+_$` and equals the target of
  skip-link #2 from prompt 01.

## Content you can keep from the current clone

The clone's current sidebar entries (`For you`, `Recent`, `Starred`,
`Apps`, `Plans`, `Spaces`/`Autoloop`, recommended section, bottom group)
are fine to keep as the visible copy. Render them **inside** the new
`<nav>` wrapper, and add the required structural descendants
(`side-nav-recommendation.jira-side-nav`, the panel splitter trio, and at
least one `more-nav-menu-button-trigger`) alongside them.

## Do-not-break

- The `Autoloop` active-state styling in
  [`src/App.css`](../src/App.css) for `.jira-sb-link.is-active` must still
  render.
- Keep all `onClick={(e) => e.preventDefault()}` handlers on the sidebar
  links.

## Ignore list for this surface

- The huge hashed-class strings on the `more-nav-menu-button-trigger`
  `<button>`s (presence of the testid is what matters).
- The `recent-section` inner content — structural wrapper is enough.

## Verification

The surface check will assert:

- Exactly one `<nav data-testid="page-layout.sidebar">` inside the
  top-level `page-layout.root`.
- The `<nav>` has `aria-label="Sidebar"`, `data-layout-slot="true"`,
  and an `id` matching `^_R[A-Za-z0-9]+_$`.
- The `<nav>`'s `style` attribute contains `--n_sNvw`.
- All required class tokens above are present on the `<nav>`.
- Required descendant `data-testid`s exist.
- At least one `more-nav-menu-button-trigger` is a `<button>` with
  `aria-haspopup="true"` and `aria-expanded="false"`.
